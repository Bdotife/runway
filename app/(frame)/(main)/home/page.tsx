"use client";

import { rolloverDefaults, useSheet } from "@/components/sheets";
import { CatRow, Icon, RunwayStrip, StatusPill } from "@/components/ui";
import { compute, fmtDate, gbp, weekly } from "@/lib/engine";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const { s, update, toast } = useStore();
  const { open } = useSheet();
  const P = s.profile!;
  const r = compute(s);
  const reason =
    r.status === "ok"
      ? `At this pace your money lasts until ${fmtDate(r.next)}.`
      : r.status === "tight"
      ? "You’ve spent more than planned, so next week has less in it."
      : `At this pace your money runs short before ${fmtDate(r.next)}.`;
  const al = Math.max(0, r.allowance);
  const list = s.entries.slice().sort((a, b) => b.t - a.t).slice(0, 10);

  return (
    <>
      <section className="hero">
        <p className="figure-label">Left to spend this week</p>
        <p className={`figure ${r.left < 0 ? "neg" : ""}`}>{gbp(Math.round(r.left))}</p>
        <div className="hero-meta">
          <StatusPill status={r.status} />
          <span>Next week: {gbp(Math.round(r.nextWeek))}</span>
        </div>
        <RunwayStrip r={r} nextAmount={P.nextAmount} />
        <p className="reason">{reason}</p>
      </section>

      {r.due && (
        <div className="banner">
          <p><strong>Has your {gbp(P.nextAmount)} loan payment arrived?</strong> Confirm it to start your next period.</p>
          <button className="btn btn-primary btn-block" onClick={() => open({ type: "rollover", d: rolloverDefaults(P.nextDate, P.nextAmount) })}>Confirm payment</button>
        </div>
      )}
      {r.status === "over" && (
        <div className="banner warn">
          <p><strong>Money looks short before {fmtDate(r.next)}.</strong> Your university’s hardship fund and student money advice team can help, and asking is free.</p>
          <div className="links">
            <a href="https://www.gov.uk/extra-money-pay-university" target="_blank" rel="noopener noreferrer">Hardship funds on GOV.UK</a>
            <a href="https://www.moneyhelper.org.uk" target="_blank" rel="noopener noreferrer">Free guidance from MoneyHelper</a>
          </div>
        </div>
      )}

      <h2 className="h2">This week</h2>
      <div>
        <CatRow main name="Spending money" val={`${gbp(r.freeWeek)} of ${gbp(al)}`} pct={al ? Math.min(100, (r.freeWeek / al) * 100) : r.freeWeek ? 100 : 0} over={r.freeWeek > al + 0.01} />
        {P.costs.map((c) => {
          const plan = weekly(c),
            spent = r.spentWeek[c.cat] || 0;
          return <CatRow key={c.name} name={c.name} val={spent ? `${gbp(spent)} of ${gbp(plan)}` : `${gbp(plan)} set aside`} pct={plan ? Math.min(100, (spent / plan) * 100) : 0} over={spent > plan + 0.01} />;
        })}
      </div>

      <h2 className="h2">Recent</h2>
      {list.length ? (
        <ul className="entries">
          {list.map((e) => (
            <li className="entry" key={e.id}>
              <span>
                <span className="entry-title">{e.kind === "income" ? "Income" : e.cat}</span>
                <span className="entry-sub">{fmtDate(e.date)}{e.note ? `, ${e.note}` : ""}</span>
              </span>
              <span className={`entry-amt ${e.kind === "income" ? "in" : ""}`}>
                {e.kind === "income" ? "+" : ""}{gbp(e.amount)}{e.kind === "income" && e.freq !== "once" ? ` a ${e.freq}` : ""}
              </span>
              <button className="icon-btn small" aria-label="Delete this entry" onClick={() => { update((x) => { x.entries = x.entries.filter((y) => y.id !== e.id); }); toast("Entry deleted"); }}>
                {Icon.x}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">Nothing logged yet. Tell Runway when you spend, like “spent £12 on food”.</p>
      )}
    </>
  );
}
