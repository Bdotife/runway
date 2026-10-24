"use client";

import { useRouter } from "next/navigation";
import { rolloverDefaults, useSheet } from "@/components/sheets";
import { fmtDate, gbp } from "@/lib/engine";
import { navFlags, useStore } from "@/lib/store";

export default function AccountPage() {
  const { s, update, toast } = useStore();
  const { open } = useSheet();
  const router = useRouter();
  const P = s.profile!;
  const A = s.account;
  const first = A?.name ? A.name.split(" ")[0] : "";

  function copyData() {
    const txt = JSON.stringify({ account: { ...A, pw: undefined }, profile: s.profile, entries: s.entries, debts: s.debts }, null, 2);
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(txt).then(() => toast("Copied your data"), () => open({ type: "copy", d: {} }));
    else open({ type: "copy", d: {} });
  }

  return (
    <>
      <h1 className="h1">{first ? `${first}’s setup` : "Your setup"}</h1>
      {A && (
        <>
          <div className="kv"><span>University</span><span>{A.uni}, {A.year}</span></div>
          <div className="kv"><span>Email</span><span>{A.email}</span></div>
        </>
      )}
      <div className="kv"><span>Available at the start of this period</span><span>{gbp(P.opening)}</span></div>
      <div className="kv"><span>Next loan payment</span><span>{gbp(P.nextAmount)} on {fmtDate(P.nextDate)}</span></div>
      {P.costs.map((c) => (
        <div className="kv" key={c.name}><span>{c.name}</span><span>{gbp(c.amount)} a {c.freq}</span></div>
      ))}
      <div className="kv"><span>Plan</span><span>{s.partner ? `Free through ${s.partner}` : "Free trial, then £7 a month"}</span></div>

      <div className="stack">
        <button className="btn btn-primary btn-block" onClick={() => open({ type: "rollover", d: rolloverDefaults(P.nextDate, P.nextAmount) })}>My loan payment arrived</button>
        <button className="btn btn-ghost btn-block" onClick={() => { update((x) => { x.profile = null; x.chat = []; x.draft = null; }); router.push("/onboarding/setup"); }}>Redo setup</button>
        <button className="btn btn-ghost btn-block" onClick={() => { navFlags.leaving = true; router.push("/"); update((x) => { x.session = false; }); toast("Signed out. Your budget is saved on this device."); }}>Sign out</button>
      </div>

      <h2 className="h2">Reminders</h2>
      <label className="toggle">
        <input type="checkbox" checked={s.notify} onChange={(e) => { const v = e.target.checked; update((x) => { x.notify = v; }); toast(v ? "Reminders on" : "Reminders off"); }} />
        <span>Remind me 3 days before a debt payment is due</span>
      </label>

      <h2 className="h2">How Runway uses AI</h2>
      <p className="small muted">AI reads what you type or say and turns it into amounts and categories, which you always confirm. Every figure is worked out by Runway’s budget calculator, not the AI. Runway gives information, not financial advice, and you make every decision.</p>

      <h2 className="h2">Your data</h2>
      <div className="stack" style={{ marginTop: 8 }}>
        <button className="btn btn-ghost btn-block" onClick={copyData}>Copy my data</button>
        <button className="btn btn-danger btn-block" onClick={() => open({ type: "delete", d: {} })}>Delete my data</button>
      </div>
    </>
  );
}
