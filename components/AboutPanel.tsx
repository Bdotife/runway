"use client";

import { useRouter } from "next/navigation";
import { CHIPS } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { useSheet } from "./sheets";

export default function AboutPanel() {
  const { s, toast } = useStore();
  const { fromText } = useSheet();
  const router = useRouter();
  const tryIt = (c: string) => {
    if (!s.session || !s.profile) return toast("Finish setup first, then try this.");
    router.push("/home");
    fromText(c);
  };
  return (
    <aside className="about" aria-label="About Runway">
      <div className="about-brand">
        <img src="/logo-mark.png" alt="" width={44} height={44} />
        <span>Runway</span>
      </div>
      <h1>Start-ups run out of cash. Students do too.</h1>
      <p>Runway turns a lump-sum student loan into a weekly number, lets students check a purchase before they make it, and keeps BNPL, overdrafts and the student loan in one view.</p>
      <h2>What it does</h2>
      <dl>
        <div><dt>A weekly figure you can trust</dt><dd>Sets aside rent and regular costs, then spreads what’s left across the weeks until the next loan payment lands.</dd></div>
        <div><dt>Ask before you spend</dt><dd>Shows what a purchase does to this week and next, then hands the decision back. No lectures, no verdicts.</dd></div>
        <div><dt>Every debt in one place</dt><dd>Shows the real cost of Klarna, an overdraft or a loan before it’s added, and what the student loan means after graduation.</dd></div>
      </dl>
      <h2>Try it</h2>
      <p>Finish setup, then tap one of these or type your own.</p>
      <div className="try">
        {CHIPS.map((c) => (
          <button key={c} className="chip" onClick={() => tryIt(c)}>{c}</button>
        ))}
      </div>
      <p className="fine">Prototype. Your account and budget stay in this browser. Runway gives information, not financial advice.</p>
    </aside>
  );
}
