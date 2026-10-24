"use client";

import Link from "next/link";
import { useEffect } from "react";
import { navFlags, useStore } from "@/lib/store";

const NAV: [string, string][] = [
  ["how", "How it works"],
  ["features", "Features"],
  ["partners", "For universities"],
  ["pricing", "Pricing"],
  ["faq", "Questions"],
];

export default function Landing() {
  const { s, ready } = useStore();
  useEffect(() => {
    navFlags.leaving = false;
  }, []);
  const signed = ready && s.session;
  const first = s.account?.name ? s.account.name.split(" ")[0] : "";
  const appHref = s.profile ? "/home" : "/onboarding/consent";

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const ctas = signed ? (
    <Link className="btn btn-primary" href={appHref}>{first ? `Open Runway, ${first}` : "Open Runway"}</Link>
  ) : (
    <>
      <Link className="btn btn-primary" href="/signup">Get started free</Link>
      <Link className="btn btn-ghost" href="/signin">Sign in</Link>
    </>
  );

  return (
    <div className="site">
      <header className="site-head">
        <div className="wrap">
          <Link href="/" className="brand brand-btn" aria-label="Runway home">
            <img src="/logo-mark.png" alt="" width={30} height={30} />
            <span>Runway</span>
          </Link>
          <nav className="site-nav" aria-label="Sections">
            {NAV.map(([id, l]) => (
              <button key={id} onClick={() => go(id)}>{l}</button>
            ))}
          </nav>
          <div className="head-cta">
            {signed ? (
              <Link className="btn btn-primary btn-sm" href={appHref}>Open Runway</Link>
            ) : (
              <>
                <Link className="btn btn-ghost btn-sm" href="/signin">Sign in</Link>
                <Link className="btn btn-primary btn-sm" href="/signup">Get started</Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="s-hero">
          <div className="wrap">
            <h1>Make your loan last until the next one lands.</h1>
            <p className="lede">Runway turns your student loan into one number to spend each week. Ask before you buy, and see every debt in one place. Built for students in the UK.</p>
            <div className="cta-row">{ctas}</div>
            <p className="cta-note">Free for your first year, and free for good if your university or bank partners with Runway.</p>
            <div className="big-runway runway demo" role="img" aria-label="Example: Lala can spend £273 a week, on track until her next loan on 8 January.">
              <div className="br-top" aria-hidden="true">
                <div>
                  <p className="br-who">Lala, second year, can spend</p>
                  <p className="br-fig">£273<small>this week</small></p>
                </div>
                <span className="pill ok">On track</span>
              </div>
              <div className="lights" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                  <span key={i} className={`week ${i === 0 ? "now" : "lit"}`} style={{ ["--i" as any]: i }} />
                ))}
              </div>
              <div className="strip-meta" aria-hidden="true">
                <span>Today: £5,400 in the bank</span>
                <span>8 Jan: £3,200 lands</span>
              </div>
            </div>
          </div>
        </section>

        <section className="s-sec" id="why">
          <div className="wrap">
            <h2>Student loans arrive in lumps. Life costs money every week.</h2>
            <p className="intro">Most budgeting apps assume a monthly salary. Students get a few payments a year, often while living away from home for the first time, and are expected to make each one last.</p>
            <div className="stats">
              <div className="stat"><strong>61%</strong><span>of students skip meals to save money</span></div>
              <div className="stat"><strong>45%</strong><span>feel confident managing their money</span></div>
              <div className="stat"><strong>1 in 4</strong><span>took on new debt to cover rising costs</span></div>
            </div>
            <p className="source">Sources: Save the Student National Student Money Survey 2025, and Runway research.</p>
          </div>
        </section>

        <section className="s-sec" id="how">
          <div className="wrap">
            <h2>How it works</h2>
            <p className="intro">Setup takes about two minutes, and there are no forms or spreadsheets.</p>
            <ol className="steps">
              <li><h3>Tell Runway what you’ve got</h3><p>Type or say your balance, when your next loan lands and what you pay each week or month.</p></li>
              <li><h3>Get your weekly number</h3><p>Runway sets aside rent and bills, then spreads the rest across the weeks until your next payment.</p></li>
              <li><h3>Check before you spend</h3><p>Ask “can I spend £30 tonight?” and see what it does to this week and next. Then you decide.</p></li>
            </ol>
          </div>
        </section>

        <section className="s-sec" id="features">
          <div className="wrap">
            <h2>What Runway does</h2>
            <div className="feat">
              <div>
                <h3>Ask before you spend</h3>
                <p>See what a purchase does to this week and next before you make it. Runway never says yes or no. It shows you the trade-off and hands the decision back.</p>
              </div>
              <div className="screen" aria-hidden="true">
                <p className="heard" style={{ marginBottom: 12 }}>You said “Can I spend £30 on a night out?”</p>
                <div className="impact">
                  <div className="imp-row"><span>Left this week</span><span><span className="was">£273</span> → <strong>£243</strong></span></div>
                  <div className="imp-row"><span>Next week</span><span><span className="was">£273</span> → <strong>£273</strong></span></div>
                  <div className="imp-row"><span>Status after</span><span className="pill ok">On track</span></div>
                </div>
                <p className="handoff">This is information to help you decide. The decision is yours.</p>
                <div className="demo-btns"><span>Skip it</span><span>I’m going ahead</span></div>
              </div>
            </div>
            <div className="feat">
              <div>
                <h3>Every debt in one place</h3>
                <p>Klarna, overdrafts, loans and your student loan, side by side. Before you add a new one, Runway shows the payment dates, the total cost and what it does to your weekly number.</p>
              </div>
              <div className="screen" aria-hidden="true">
                <div className="debt" style={{ paddingTop: 0 }}>
                  <div className="debt-head" style={{ paddingTop: 0 }}>
                    <span><span className="debt-name">Klarna <span className="muted" style={{ fontWeight: 400 }}>for laptop</span></span><span className="debt-sub">Next £300 on 21 Nov</span></span>
                    <span className="debt-amt">£600</span>
                  </div>
                  <span className="bar"><i style={{ width: "33%" }} /></span>
                </div>
                <div className="debt">
                  <div className="debt-head">
                    <span><span className="debt-name">Overdraft</span><span className="debt-sub">Interest-free up to £500</span></span>
                    <span className="debt-amt">£250</span>
                  </div>
                </div>
                <p className="repay" style={{ marginTop: 16 }}>Student loan: you’d repay <strong>£37.50</strong> a month</p>
                <p className="small muted" style={{ margin: 0 }}>If you later earn £30,000 a year, on Plan 5.</p>
              </div>
            </div>
            <div className="feat">
              <div>
                <h3>Talk to it like a friend</h3>
                <p>Say “spent £12 on food” and it’s logged. Logging takes seconds, so you actually keep doing it. Typing always works too, and you confirm everything before it’s saved.</p>
              </div>
              <div className="screen chat" aria-hidden="true" style={{ display: "flex", flexDirection: "column" }}>
                <div className="msg me">Spent £12 on food</div>
                <div className="msg bot">Logged £12 to Food. You have £261 left to spend this week.</div>
                <div className="msg me">I’ve started a part-time job earning £50 a week</div>
                <div className="msg bot">Added £50 a week. Next week goes up to £323.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="s-sec" id="partners">
          <div className="wrap">
            <h2>For universities and banks</h2>
            <p className="intro">Give every student a budgeting tool built for how student money actually works. Runway supports student welfare and helps banks meet Consumer Duty, for £2.50 per student per month.</p>
            <ul className="s-list">
              <li><strong>Simple to roll out</strong><span>Students join with an invite code. No integration is needed to start.</span></li>
              <li><strong>A perk students use</strong><span>Sits alongside the offers that already come with student bank accounts.</span></li>
              <li><strong>Information, not advice</strong><span>Designed to inform and educate, keeping clear of regulated financial advice.</span></li>
            </ul>
          </div>
        </section>

        <section className="s-sec" id="pricing">
          <div className="wrap">
            <h2>Pricing</h2>
            <p className="intro">Students on a tight budget shouldn’t have to pay much to stay on top of it.</p>
            <div className="plans">
              <div className="plan lead-plan"><h3>Through your university or bank</h3><p className="price">Free</p><p>If your university or bank partners with Runway, they cover it. Join with your invite code.</p></div>
              <div className="plan"><h3>On your own</h3><p className="price">£7<small>a month</small></p><p>Free for your first year, for apprentices and students at any university.</p></div>
              <div className="plan"><h3>For institutions</h3><p className="price">£2.50<small>per student a month</small></p><p>For universities and banks offering Runway to their students.</p></div>
            </div>
          </div>
        </section>

        <section className="s-sec" id="trust">
          <div className="wrap">
            <div className="trust">
              <h2>Information, not advice</h2>
              <p className="intro">Runway shows you the numbers and the trade-offs. It never tells you what to buy, borrow or invest in.</p>
              <ul className="s-list">
                <li><strong>You decide</strong><span>Every answer ends by handing the decision back to you.</span></li>
                <li><strong>Numbers you can check</strong><span>AI understands what you type. Every figure comes from Runway’s budget calculator, not the AI.</span></li>
                <li><strong>Your data, your call</strong><span>Never sold. Copy it or delete it any time from your account.</span></li>
              </ul>
            </div>
          </div>
        </section>

        <section className="s-sec" id="faq">
          <div className="wrap">
            <h2>Questions</h2>
            <div className="faq">
              <details><summary>Is Runway financial advice?</summary><p>No. Runway gives you information about your own money so you can make your own decisions. If a question is about investing or borrowing, it points you to official sources such as MoneyHelper and the FCA Register.</p></details>
              <details><summary>Does it connect to my bank?</summary><p>Not yet. You tell Runway what you spend by typing or talking, which takes a few seconds. Automatic bank sync is planned with partner banks.</p></details>
              <details><summary>What happens to my data?</summary><p>Runway uses your details only to work out your weekly number. It never sells your data, and you can copy or delete it at any time from the You tab.</p></details>
              <details><summary>What if my loan just doesn’t cover my costs?</summary><p>Runway shows you early, before the money runs out, and points you to your university’s hardship fund and free money advice.</p></details>
              <details><summary>Why would I talk to a budgeting app?</summary><p>Because manual entry is what makes people give up on budgeting. Saying “spent £12 on food” is quicker than filling in a form. You can always type instead.</p></details>
            </div>
          </div>
        </section>

        <section className="s-sec final">
          <div className="wrap">
            <h2>Your next loan lands soon. Make this one last.</h2>
            <div className="cta-row">{ctas}</div>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <div className="wrap">
          <span className="brand"><img src="/logo-mark.png" alt="" width={24} height={24} /><span>Runway</span></span>
          <span>Built for students in the UK. Prototype: your account and budget stay in this browser.</span>
        </div>
      </footer>
    </div>
  );
}
