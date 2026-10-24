"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/ui";
import { useGuard } from "@/components/useRedirectIf";
import { useStore } from "@/lib/store";

export default function ConsentPage() {
  const { update } = useStore();
  const router = useRouter();
  const ok = useGuard((t) => t === "/onboarding/consent");
  const [ai, setAi] = useState(false);
  const [data, setData] = useState(false);
  if (!ok) return <div className="col" />;
  return (
    <div className="col">
      <TopBar note="Step 2 of 4" />
      <div className="pad">
        <Link className="back" href="/" style={{ display: "inline-block", textDecoration: "none" }}>‹ Back to site</Link>
        <h1 className="h1">Before we start</h1>
        <p className="lead">Runway uses AI to understand what you type or say. It shows you information about your money so you can decide. It doesn’t give financial advice, and it never decides for you.</p>
        <label className="check">
          <input type="checkbox" checked={ai} onChange={(e) => setAi(e.target.checked)} />
          <span>I understand Runway uses AI and gives information, not financial advice.</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={data} onChange={(e) => setData(e.target.checked)} />
          <span>I agree to Runway storing my budget details to work out my weekly figure. I can delete them any time.</span>
        </label>
        <button
          className="btn btn-primary btn-block"
          disabled={!(ai && data)}
          onClick={() => {
            update((x) => {
              x.consent = { ai: true, data: true };
            });
            router.push("/onboarding/setup");
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
