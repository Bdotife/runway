"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, TopBar } from "@/components/ui";
import { useGuard } from "@/components/useRedirectIf";
import { State, cap, catOf, compute, iso, num, parseIso, today0 } from "@/lib/engine";
import { useStore } from "@/lib/store";

export default function ConfirmPage() {
  const { s, ready, update, toast } = useStore();
  const router = useRouter();
  const ok = useGuard((t) => t === "/onboarding/confirm");
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    if (ready && s.draft && !d) setD(JSON.parse(JSON.stringify(s.draft)));
  }, [ready, s.draft, d]);

  if (!ok || !d) return <div className="col" />;

  const setField = (k: string, v: any) => setD((x: any) => ({ ...x, [k]: v }));
  const setCost = (i: number, k: string, v: any) =>
    setD((x: any) => ({ ...x, costs: x.costs.map((c: any, j: number) => (j === i ? { ...c, [k]: v } : c)) }));

  function confirm() {
    const bal = num(d.balance),
      na = num(d.nextAmount);
    if (!(bal >= 0)) return toast("Add how much you have available now.");
    if (!(na > 0)) return toast("Add your next loan payment amount.");
    if (!d.nextDate || parseIso(d.nextDate) <= today0()) return toast("Pick a payment date after today.");
    const costs = d.costs
      .filter((c: any) => num(c.amount) > 0 && String(c.name).trim())
      .map((c: any) => {
        const name = cap(String(c.name).trim());
        const k = catOf(name);
        return { name, cat: k === "Other" ? name : k, amount: num(c.amount), freq: c.freq };
      });
    update((x: State) => {
      x.draft = d;
      x.profile = { opening: bal, nextAmount: na, nextDate: d.nextDate, periodStart: iso(today0()), costs };
      x.baseline = 0;
      x.baseline = compute(x).allowance;
    });
    toast("Your weekly figure is ready");
    router.push("/home");
  }

  return (
    <div className="col">
      <TopBar note="Step 4 of 4" />
      <div className="main">
        <Link className="back" href="/onboarding/setup" style={{ display: "inline-block", textDecoration: "none" }}>‹ Back to chat</Link>
        <h1 className="h1">Is this right?</h1>
        <p className="lead">Nothing is saved until you confirm. Fix anything I got wrong.</p>
        <div className="fr">
          <label className="lbl" htmlFor="d-balance">Available now</label>
          <div className="money-wrap"><span>£</span><input id="d-balance" className="inp" inputMode="decimal" value={d.balance ?? ""} onChange={(e) => setField("balance", e.target.value)} /></div>
        </div>
        <div className="two">
          <div className="fr">
            <label className="lbl" htmlFor="d-next">Next loan payment</label>
            <div className="money-wrap"><span>£</span><input id="d-next" className="inp" inputMode="decimal" value={d.nextAmount ?? ""} onChange={(e) => setField("nextAmount", e.target.value)} /></div>
          </div>
          <div className="fr">
            <label className="lbl" htmlFor="d-date">Lands on</label>
            <input id="d-date" type="date" className="inp" value={d.nextDate || ""} onChange={(e) => setField("nextDate", e.target.value)} />
          </div>
        </div>
        <h2 className="h2">Regular costs</h2>
        {d.costs.length === 0 && <p className="empty">No regular costs yet. Add rent, food or anything you pay every week or month.</p>}
        {d.costs.map((c: any, i: number) => (
          <div className="cost-row" key={i}>
            <input className="inp" aria-label="Cost name" placeholder="Name" value={c.name} onChange={(e) => setCost(i, "name", e.target.value)} />
            <div className="money-wrap"><span>£</span><input className="inp" inputMode="decimal" aria-label={`${c.name || "Cost"} amount`} value={c.amount} onChange={(e) => setCost(i, "amount", e.target.value)} /></div>
            <select className="inp" aria-label="How often" value={c.freq} onChange={(e) => setCost(i, "freq", e.target.value)}>
              {["week", "month", "term"].map((f) => <option key={f} value={f}>a {f}</option>)}
            </select>
            <button className="icon-btn small" aria-label={`Remove ${c.name || "cost"}`} onClick={() => setD((x: any) => ({ ...x, costs: x.costs.filter((_: any, j: number) => j !== i) }))}>{Icon.x}</button>
          </div>
        ))}
        <button className="link" onClick={() => setD((x: any) => ({ ...x, costs: [...x.costs, { name: "", cat: "", amount: "", freq: "month" }] }))}>Add a cost</button>
      </div>
      <div className="footer-bar"><button className="btn btn-primary btn-block" onClick={confirm}>Looks right</button></div>
    </div>
  );
}
