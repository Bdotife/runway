"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Debt, fmtDate, gbp, parseIso, repayMonthly, today0 } from "@/lib/engine";
import { useStore } from "@/lib/store";

function DebtsInner() {
  const { s, update, toast } = useStore();
  const params = useSearchParams();
  const [openId, setOpenId] = useState<string | null>(null);
  useEffect(() => {
    const id = params.get("open");
    if (id) setOpenId(id);
  }, [params]);

  const owed = s.debts.reduce((a, d) => a + (d.type === "overdraft" ? d.principal : d.instalments.filter((i) => !i.paid).reduce((x, i) => x + i.amount, 0)), 0);
  const up = s.debts
    .flatMap((d) => d.instalments.filter((i) => !i.paid).map((i) => ({ d, i })))
    .sort((a, b) => (a.i.due < b.i.due ? -1 : 1))[0];
  const L = s.studentLoan;

  return (
    <>
      <section className="hero small">
        <p className="figure-label">You owe, not counting your student loan</p>
        <p className="figure">{gbp(owed)}</p>
        <p className="hero-line">{up ? `Next payment ${gbp(up.i.amount)} to ${up.d.provider} on ${fmtDate(up.i.due)}` : "No payments coming up"}</p>
      </section>

      {s.tipBnpl && !s.tipSeen && (
        <div className="banner">
          <p><strong>Worth knowing:</strong> BNPL providers such as Klarna can report missed payments to credit reference agencies, which can affect your credit file. Runway will remind you 3 days before each payment.</p>
          <button className="link" onClick={() => update((x) => { x.tipSeen = true; })}>Got it</button>
        </div>
      )}

      <h2 className="h2">Short-term debts</h2>
      {s.debts.length ? (
        s.debts.map((d) => (
          <DebtCard key={d.id} d={d} open={openId === d.id} onToggle={() => setOpenId(openId === d.id ? null : d.id)}
            onPaid={(k) => { update((x) => { x.debts.find((y) => y.id === d.id)!.instalments[k].paid = true; }); toast("Marked as paid"); }}
            onDelete={() => { update((x) => { x.debts = x.debts.filter((y) => y.id !== d.id); }); toast("Debt removed"); }} />
        ))
      ) : (
        <p className="empty">Nothing here yet. If you use Klarna, an overdraft or a loan, tell Runway and it’ll show you the real cost before you add it.</p>
      )}

      <h2 className="h2">Student loan</h2>
      <div className="sl">
        <div className="fr">
          <label className="lbl" htmlFor="sl-b">Borrowed so far, estimated</label>
          <div className="money-wrap"><span>£</span><input id="sl-b" className="inp" inputMode="decimal" value={L.borrowed} onChange={(e) => update((x) => { x.studentLoan.borrowed = Number(e.target.value.replace(/[^\d.]/g, "")) || 0; })} /></div>
        </div>
        <p className="small muted" style={{ marginTop: -6 }}>Check the exact figure in your Student Finance account.</p>
        <div className="fr">
          <label className="lbl" htmlFor="sl-s">If you later earn <strong style={{ color: "var(--text)" }}>{gbp(L.salary)}</strong> a year</label>
          <input id="sl-s" type="range" min={20000} max={70000} step={1000} value={L.salary} onChange={(e) => update((x) => { x.studentLoan.salary = Number(e.target.value); })} />
        </div>
        <p className="repay">You’d repay <strong>{gbp(repayMonthly(L.salary), true)}</strong> a month</p>
        <p className="small muted">
          Assumes Plan 5, for courses starting from August 2023: 9% of income above £25,000, and anything left is written off after 40 years. What you repay depends on what you earn, not on how much you owe.{" "}
          <a href="https://www.gov.uk/repaying-your-student-loan" target="_blank" rel="noopener noreferrer">How repayment works on GOV.UK</a>
        </p>
      </div>
    </>
  );
}

function DebtCard({ d, open, onToggle, onPaid, onDelete }: { d: Debt; open: boolean; onToggle: () => void; onPaid: (k: number) => void; onDelete: () => void }) {
  const t0 = today0();
  const unpaid = d.instalments.filter((i) => !i.paid);
  const nx = unpaid[0];
  const remaining = d.type === "overdraft" ? d.principal : unpaid.reduce((a, i) => a + i.amount, 0);
  const late = !!nx && parseIso(nx.due) < t0;
  const prog = d.instalments.length ? ((d.instalments.length - unpaid.length) / d.instalments.length) * 100 : 0;
  const sub = d.type === "overdraft" ? "Overdraft balance" : nx ? `Next ${gbp(nx.amount)} on ${fmtDate(nx.due)}${late ? ", overdue" : ""}` : "Paid off";
  return (
    <div className="debt">
      <button className="debt-head" onClick={onToggle} aria-expanded={open}>
        <span>
          <span className="debt-name">{d.provider}{d.label && <span className="muted" style={{ fontWeight: 400 }}> for {d.label.toLowerCase()}</span>}</span>
          <span className={`debt-sub ${late ? "late" : ""}`}>{sub}</span>
        </span>
        <span className="debt-amt">{gbp(remaining)}</span>
      </button>
      {d.instalments.length > 0 && <span className="bar" aria-hidden="true"><i style={{ width: `${prog}%` }} /></span>}
      {open && (
        <>
          {d.type === "overdraft" ? (
            <>
              <div className="facts">
                <span>Balance</span><span>{gbp(d.principal)}</span>
                <span>Interest-free up to</span><span>{gbp(d.free)}</span>
                <span>Interest above that</span><span>{d.apr}% a year</span>
                <span>Interest this month, about</span><span>{gbp((Math.max(0, d.principal - d.free) * d.apr) / 100 / 12, true)}</span>
              </div>
              <p className="small muted">Interest-free limits often shrink after graduation. Check the date with your bank.</p>
            </>
          ) : (
            <>
              <ul className="sched">
                {d.instalments.map((i, k) => (
                  <li key={k}>
                    <span>{fmtDate(i.due)}{!i.paid && parseIso(i.due) < t0 && <span className="debt-sub late" style={{ display: "inline" }}> overdue</span>}</span>
                    <span style={{ fontVariantNumeric: "tabular-nums" }}>{gbp(i.amount, true)}</span>
                    {i.paid ? <span className="done">Paid</span> : <button className="mini" onClick={() => onPaid(k)}>Mark paid</button>}
                  </li>
                ))}
              </ul>
              <div className="facts">
                <span>Borrowed</span><span>{gbp(d.principal, true)}</span>
                <span>Total you’ll pay</span><span>{gbp(d.total, true)}</span>
                <span>Interest and fees</span><span>{gbp(d.interest, true)}</span>
              </div>
            </>
          )}
          <button className="link" onClick={onDelete}>Remove this debt</button>
        </>
      )}
    </div>
  );
}

export default function DebtsPage() {
  return (
    <Suspense fallback={null}>
      <DebtsInner />
    </Suspense>
  );
}
