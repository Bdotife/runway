"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EXTRA_CATS, addDays, amounts, buildDebt, cashNow, compute, debtGuess, fmtDate, freqAfter, gbp, guessCat, intent, iso, num, parseIso, today0, uid,
} from "@/lib/engine";
import { navFlags, useStore } from "@/lib/store";
import { MoneyField, SelectField, StatusPill, TextField } from "./ui";

type SheetType = "afford" | "entry" | "debt" | "resource" | "rollover" | "delete" | "copy";
type Sheet = { type: SheetType; raw?: string; d: Record<string, any> };

const Ctx = createContext<{ open: (s: Sheet) => void; close: () => void; fromText: (q: string) => void; sheet: Sheet | null } | null>(null);

export function SheetProvider({ children }: { children: React.ReactNode }) {
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const open = useCallback((s: Sheet) => setSheet(s), []);
  const close = useCallback(() => setSheet(null), []);
  const fromText = useCallback((q: string) => {
    const i = intent(q);
    const am = amounts(q);
    const amt = am.length ? String(am[0].v) : "";
    if (i === "afford") setSheet({ type: "afford", raw: q, d: { amount: amt, cat: guessCat(q, "Going out") } });
    else if (i === "spend") setSheet({ type: "entry", raw: q, d: { kind: "spend", amount: amt, cat: guessCat(q, "Other"), note: q } });
    else if (i === "income") {
      const f = am.length ? freqAfter(q, am[0].end) : null;
      setSheet({ type: "entry", raw: q, d: { kind: "income", amount: amt, freq: f && f !== "term" ? f : "once", note: q } });
    } else if (i === "debt") setSheet({ type: "debt", raw: q, d: debtGuess(q, amt === "" ? "" : Number(amt)) });
    else setSheet({ type: "resource", raw: q, d: {} });
  }, []);
  return <Ctx.Provider value={{ open, close, fromText, sheet }}>{children}</Ctx.Provider>;
}

export function useSheet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSheet must be used inside SheetProvider");
  return v;
}

const short = (q: string) => (q.length > 46 ? q.slice(0, 44) + "…" : q);

export function SheetHost() {
  const { sheet, close } = useSheet();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);
  if (!sheet) return null;
  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <span className="grab" aria-hidden="true" />
        <SheetBody key={sheet.type + (sheet.raw || "")} sheet={sheet} />
      </div>
    </div>
  );
}

function SheetBody({ sheet }: { sheet: Sheet }) {
  const { s, update, reset, toast } = useStore();
  const { close } = useSheet();
  const router = useRouter();
  const [d, setD] = useState<Record<string, any>>(sheet.d);
  const set = (k: string, v: any) => setD((x) => ({ ...x, [k]: v }));
  const first = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = first.current?.querySelector<HTMLInputElement>("input:not([value]), input[value=''], .btn-primary, input, select, button");
    el?.focus({ preventScroll: true });
  }, []);

  const heard = sheet.raw ? <p className="heard">You said “{sheet.raw}”</p> : null;
  const catOpts = [...new Set((s.profile ? s.profile.costs.map((c) => c.cat) : []).concat(EXTRA_CATS))];
  const amt = num(d.amount);
  const t = iso(today0());

  const addEntry = (e: any) =>
    update((x) => {
      x.entries.push({ id: uid(), date: t, t: Date.now(), ...e });
    });

  let title = "";
  let body: React.ReactNode = null;
  let actions: React.ReactNode = null;
  let one = false;

  if (sheet.type === "afford") {
    title = "Before you spend";
    let live: React.ReactNode = <p className="muted">Enter an amount to see what it does to your week.</p>;
    if (amt > 0 && s.profile) {
      const b = compute(s),
        a = compute(s, [{ kind: "spend", amount: amt, cat: d.cat, date: t }]);
      const sum =
        a.status === "over"
          ? `Spending ${gbp(amt)} would mean your money runs short before ${fmtDate(a.next)} on your current plan.`
          : a.left < 0
          ? `That’s ${gbp(-a.left)} more than you have left this week, so next week drops to ${gbp(a.nextWeek)}.`
          : `You’d have ${gbp(a.left)} left this week, and next week stays at ${gbp(a.nextWeek)}.`;
      live = (
        <>
          <Impact rows={[["Left this week", b.left, a.left], ["Next week", b.nextWeek, a.nextWeek]]} status={a.status} />
          <p className="summary">{sum}</p>
          <p className="handoff">This is information to help you decide. The decision is yours.</p>
        </>
      );
    }
    body = (
      <>
        <div className="two">
          <MoneyField id="sf-amount" label="Amount" value={d.amount} onChange={(v) => set("amount", v)} />
          <SelectField id="sf-cat" label="Comes from" value={d.cat} options={catOpts} onChange={(v) => set("cat", v)} />
        </div>
        {live}
      </>
    );
    actions = (
      <>
        <button className="btn btn-ghost" onClick={() => { close(); toast("Skipped. Nothing was logged."); }}>
          Skip it
        </button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!(amt > 0)) return toast("Enter an amount first.");
            addEntry({ kind: "spend", amount: amt, cat: d.cat, note: short(sheet.raw || "") });
            close();
            toast(`Logged ${gbp(amt)} to ${d.cat}`);
          }}
        >
          I’m going ahead
        </button>
      </>
    );
  } else if (sheet.type === "entry") {
    const inc = d.kind === "income";
    title = inc ? "Add this income" : "Log this spend";
    let live: React.ReactNode = <p className="muted">How much was it? Enter the amount to save it.</p>;
    if (amt > 0 && s.profile) {
      const e = inc ? { kind: "income" as const, amount: amt, freq: d.freq, date: t } : { kind: "spend" as const, amount: amt, cat: d.cat, date: t };
      const b = compute(s),
        a = compute(s, [e]);
      live = (
        <>
          <Impact rows={[["Left this week", b.left, a.left], ["Next week", b.nextWeek, a.nextWeek]]} status={a.status} />
          {!inc && amt > s.baseline && <p className="handoff">This is more than a week’s spending money, so Runway spreads it across the weeks until {fmtDate(a.next)}.</p>}
        </>
      );
    }
    body = (
      <>
        <div className="two">
          <MoneyField id="sf-amount" label="Amount" value={d.amount} onChange={(v) => set("amount", v)} />
          {inc ? (
            <SelectField id="sf-freq" label="How often" value={d.freq} options={[["once", "Just once"], ["week", "Every week"], ["month", "Every month"]]} onChange={(v) => set("freq", v)} />
          ) : (
            <SelectField id="sf-cat" label="Category" value={d.cat} options={catOpts} onChange={(v) => set("cat", v)} />
          )}
        </div>
        {live}
      </>
    );
    actions = (
      <>
        <button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!(amt > 0)) return toast("Enter an amount first.");
            if (inc) addEntry({ kind: "income", amount: amt, freq: d.freq, cat: "Income", note: short(d.note || "") });
            else addEntry({ kind: "spend", amount: amt, cat: d.cat, note: short(d.note || "") });
            close();
            toast(inc ? `Added ${gbp(amt)}${d.freq !== "once" ? " a " + d.freq : ""} income` : `Logged ${gbp(amt)} to ${d.cat}`);
          }}
        >
          {inc ? "Add income" : "Log spend"}
        </button>
      </>
    );
  } else if (sheet.type === "debt") {
    title = "Before you add this debt";
    let live: React.ReactNode = <p className="muted">How much was it? Enter the amount to see the repayment plan.</p>;
    if (amt > 0 && s.profile) {
      const db = buildDebt(d);
      const b = compute(s),
        a = compute(s, [], [db]);
      const inPeriod = db.instalments.filter((i) => parseIso(i.due) <= parseIso(s.profile!.nextDate)).reduce((x, i) => x + i.amount, 0);
      live = (
        <>
          {d.type === "overdraft" ? (
            <div className="facts">
              <span>Above interest-free limit</span>
              <span>{gbp(Math.max(0, amt - (num(d.free) || 0)))}</span>
              <span>Interest on that, about</span>
              <span>{gbp((Math.max(0, amt - (num(d.free) || 0)) * (num(d.apr) || 0)) / 100 / 12, true)} a month</span>
            </div>
          ) : (
            <>
              <ul className="sched">
                {db.instalments.slice(0, 6).map((i, k) => (
                  <li key={k}>
                    <span>{fmtDate(i.due)}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{gbp(i.amount, true)}</span>
                    <span />
                  </li>
                ))}
                {db.instalments.length > 6 && (
                  <li>
                    <span className="muted">and {db.instalments.length - 6} more</span>
                    <span />
                    <span />
                  </li>
                )}
              </ul>
              <div className="facts">
                <span>Total you’ll pay</span>
                <span>{gbp(db.total, true)}</span>
                <span>Interest and fees</span>
                <span>{gbp(db.interest, true)}</span>
                <span>Due before {fmtDate(s.profile.nextDate)}</span>
                <span>{gbp(inPeriod, true)}</span>
              </div>
            </>
          )}
          <Impact rows={[["Next week’s spending money", b.nextWeek, a.nextWeek]]} status={a.status} />
          <p className="handoff">
            Runway sets aside each payment in the week it’s due.{" "}
            <a href="https://www.moneyhelper.org.uk" target="_blank" rel="noopener noreferrer">MoneyHelper</a> explains how{" "}
            {d.type === "overdraft" ? "overdrafts" : d.type === "loan" ? "loans" : "buy now pay later"} work. The decision is yours.
          </p>
        </>
      );
    }
    const changeType = (v: string) =>
      setD((x) => ({ ...x, type: v, ...(v === "overdraft" ? { apr: "39.9", free: "500" } : v === "loan" ? { apr: "19.9", months: "12" } : {}) }));
    body = (
      <>
        <div className="two">
          <TextField id="sf-provider" label="Provider" value={d.provider} onChange={(v) => set("provider", v)} />
          <SelectField id="sf-type" label="Type" value={d.type} options={[["pay3", "Pay in 3, monthly"], ["pay4", "Pay in 4, every 2 weeks"], ["overdraft", "Overdraft"], ["loan", "Loan, monthly"]]} onChange={changeType} />
        </div>
        <div className="two">
          <MoneyField id="sf-amount" label={d.type === "overdraft" ? "Overdrawn by" : "Amount"} value={d.amount} onChange={(v) => set("amount", v)} />
          <TextField id="sf-start" label="First payment" type="date" value={d.start} onChange={(v) => set("start", v)} />
        </div>
        {d.type === "loan" && (
          <div className="two">
            <TextField id="sf-apr" label="Interest (APR %)" inputMode="decimal" value={d.apr} onChange={(v) => set("apr", v)} />
            <TextField id="sf-months" label="Months to repay" inputMode="numeric" value={d.months} onChange={(v) => set("months", v)} />
          </div>
        )}
        {d.type === "overdraft" && (
          <div className="two">
            <MoneyField id="sf-free" label="Interest-free up to" value={d.free} onChange={(v) => set("free", v)} />
            <TextField id="sf-apr" label="Interest above that (APR %)" inputMode="decimal" value={d.apr} onChange={(v) => set("apr", v)} />
          </div>
        )}
        {live}
      </>
    );
    actions = (
      <>
        <button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!(amt > 0)) return toast("Enter an amount first.");
            const db = buildDebt(d);
            update((x) => {
              x.debts.push(db);
              if (d.type === "pay3" || d.type === "pay4") x.tipBnpl = true;
            });
            close();
            router.push(`/debts?open=${db.id}`);
            toast(`${db.provider} added to your tracker`);
          }}
        >
          Add to my tracker
        </button>
      </>
    );
  } else if (sheet.type === "resource") {
    title = "That’s outside what Runway covers";
    one = true;
    body = (
      <>
        <p className="summary">Runway helps with budgeting and keeping track of debt. It can’t tell you whether to invest, borrow or buy a financial product. These official sources explain your options:</p>
        <ul className="res">
          <li><a href="https://www.moneyhelper.org.uk" target="_blank" rel="noopener noreferrer">MoneyHelper</a><span>Free, government-backed guidance on saving, investing and borrowing</span></li>
          <li><a href="https://register.fca.org.uk" target="_blank" rel="noopener noreferrer">FCA Register</a><span>Check whether a firm is authorised before you use it</span></li>
          <li><a href="https://www.actionfraud.police.uk" target="_blank" rel="noopener noreferrer">Action Fraud</a><span>Report or check a suspected scam</span></li>
        </ul>
        <p className="handoff">The decision is yours. If you’re unsure, consider speaking to a qualified professional.</p>
      </>
    );
    actions = <button className="btn btn-ghost" onClick={close}>Done</button>;
  } else if (sheet.type === "rollover") {
    title = "Your loan payment arrived";
    const carry = s.profile ? cashNow(s) : 0;
    const got = num(d.amount) || 0;
    body = (
      <>
        <MoneyField id="sf-amount" label="Amount you received" value={d.amount} onChange={(v) => set("amount", v)} />
        <div className="two">
          <TextField id="sf-nextDate" label="Next payment lands on" type="date" value={d.nextDate} onChange={(v) => set("nextDate", v)} />
          <MoneyField id="sf-nextAmount" label="Next payment amount" value={d.nextAmount} onChange={(v) => set("nextAmount", v)} />
        </div>
        <div className="impact">
          <div className="imp-row"><span>Carried over</span><strong>{gbp(carry)}</strong></div>
          <div className="imp-row"><span>New starting amount</span><strong>{gbp(carry + got)}</strong></div>
        </div>
        <p className="handoff">Your regular costs and debts carry over. Only the dates change.</p>
      </>
    );
    actions = (
      <>
        <button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!(got >= 0)) return toast("Enter the amount you received.");
            if (!d.nextDate || parseIso(d.nextDate) <= today0()) return toast("Pick a next payment date after today.");
            update((x) => {
              const P = x.profile!;
              P.opening = carry + got;
              P.periodStart = t;
              P.nextDate = d.nextDate;
              P.nextAmount = num(d.nextAmount) || P.nextAmount;
              x.entries = x.entries.filter((e) => e.kind === "income" && e.freq !== "once").map((e) => ({ ...e, date: t }));
              x.debts.forEach((db) => db.instalments.forEach((i) => { if (parseIso(i.due) <= today0()) i.paid = true; }));
              x.baseline = 0;
              x.baseline = compute(x).allowance;
            });
            close();
            router.push("/home");
            toast(`New period started with ${gbp(carry)} carried over`);
          }}
        >
          Start new period
        </button>
      </>
    );
  } else if (sheet.type === "delete") {
    title = "Delete your data?";
    body = <p className="summary">This removes your account, budget, entries and debts from this device. You can’t undo this.</p>;
    actions = (
      <>
        <button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button
          className="btn btn-danger"
          onClick={() => {
            navFlags.leaving = true;
            close();
            router.push("/");
            reset();
            toast("Your data has been deleted");
          }}
        >
          Delete my data
        </button>
      </>
    );
  } else if (sheet.type === "copy") {
    title = "Your data";
    one = true;
    body = (
      <>
        <label className="lbl" htmlFor="dump">Select all and copy</label>
        <textarea id="dump" className="inp" readOnly value={JSON.stringify({ account: { ...s.account, pw: undefined }, profile: s.profile, entries: s.entries, debts: s.debts }, null, 2)} />
      </>
    );
    actions = <button className="btn btn-ghost" onClick={close}>Done</button>;
  }

  return (
    <div ref={first}>
      <h2 className="sheet-title" id="sheet-title">{title}</h2>
      {heard}
      {body}
      <div className={`sheet-actions ${one ? "one" : ""}`}>{actions}</div>
    </div>
  );
}

function Impact({ rows, status }: { rows: [string, number, number][]; status: any }) {
  return (
    <div className="impact">
      {rows.map(([l, b, a]) => (
        <div className="imp-row" key={l}>
          <span>{l}</span>
          <span>
            <span className="was">{gbp(b)}</span> → <strong>{gbp(a)}</strong>
          </span>
        </div>
      ))}
      <div className="imp-row">
        <span>Status after</span>
        <StatusPill status={status} />
      </div>
    </div>
  );
}

export function rolloverDefaults(nextDate: string, nextAmount: number) {
  return { amount: String(nextAmount), nextDate: iso(addDays(parseIso(nextDate), 112)), nextAmount: String(nextAmount) };
}
