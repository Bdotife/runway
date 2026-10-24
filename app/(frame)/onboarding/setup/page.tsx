"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Composer from "@/components/Composer";
import { TopBar } from "@/components/ui";
import { useGuard } from "@/components/useRedirectIf";
import { LALA, parseSetup } from "@/lib/engine";
import { useStore } from "@/lib/store";

const INTRO = "Tell me what you’ve got right now, when your next loan payment lands, and your regular costs like rent and food. Write it the way you’d text a friend.";

export default function SetupPage() {
  const { s, update } = useStore();
  const router = useRouter();
  const ok = useGuard((t) => t === "/onboarding/setup" || t === "/onboarding/confirm");
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [s.chat.length]);

  if (!ok) return <div className="col" />;

  function submit(q: string) {
    let done = false;
    update((x) => {
      x.chat.push({ who: "me", text: q });
      const all = x.chat.filter((m) => m.who === "me").map((m) => m.text).join(" ");
      const p = parseSetup(all);
      const prev = x.draft || { balance: null, nextAmount: null, nextDate: null, costs: [] };
      const costs = prev.costs.slice();
      for (const c of p.costs) if (!costs.some((y) => y.cat === c.cat)) costs.push(c);
      x.draft = {
        balance: p.balance ?? prev.balance ?? null,
        nextAmount: p.nextAmount ?? prev.nextAmount ?? null,
        nextDate: p.nextDate ?? prev.nextDate ?? null,
        costs,
      };
      const d = x.draft;
      if (d.balance == null) x.chat.push({ who: "bot", text: "How much do you have available right now?" });
      else if (d.nextAmount == null || !d.nextDate)
        x.chat.push({ who: "bot", text: "When does your next loan payment land, and how much will it be? For example “£3,200 on 8 January”." });
      else {
        x.chat.push({ who: "bot", text: "Got it. Check I’ve understood you properly." });
        done = true;
      }
    });
    setTimeout(() => {
      if (done) router.push("/onboarding/confirm");
    }, 700);
  }

  const msgs = [{ who: "bot", text: INTRO }, ...s.chat];
  return (
    <div className="col">
      <TopBar note="Step 3 of 4" />
      <div className="main chat" ref={scroller}>
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.who}`}>{m.text}</div>
        ))}
        {s.chat.length === 0 && (
          <button className="example" onClick={() => submit(LALA)}>
            <strong>Use Lala’s example</strong>“{LALA}”
          </button>
        )}
      </div>
      <Composer mode="onboard" onSubmit={submit} />
    </div>
  );
}
