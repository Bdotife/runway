"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/ui";
import { useGuard } from "@/components/useRedirectIf";
import { PARTNERS, UNIS, UNI_PARTNERS, YEARS, fresh, hashPw, normCode } from "@/lib/engine";
import { useStore } from "@/lib/store";

type Errs = Partial<Record<"name" | "uni" | "email" | "password" | "invite", string>>;

export default function SignupPage() {
  const { s, update, toast } = useStore();
  const router = useRouter();
  const ok = useGuard((t) => t === "/signup" || t === "/signin");
  const [f, setF] = useState({ name: "", uni: "", year: YEARS[0], email: "", password: "", invite: "" });
  const [showPw, setShowPw] = useState(false);
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  if (!ok) return <div className="col" />;

  const set = (k: keyof typeof f, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    if (errs[k as keyof Errs]) setErrs((e) => ({ ...e, [k]: undefined }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Errs = {};
    if (!f.name.trim()) er.name = "Enter your name.";
    if (!f.uni.trim()) er.uni = "Enter your university.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) er.email = "Enter an email address like you@university.ac.uk.";
    if (f.password.length < 8 || !/\d/.test(f.password)) er.password = "Use at least 8 characters, including a number.";
    if (f.invite.trim() && !PARTNERS[normCode(f.invite)]) er.invite = "That code isn’t recognised. Check it with your bank or university, or leave it blank.";
    setErrs(er);
    const firstErr = Object.keys(er)[0];
    if (firstErr) {
      document.getElementById("acc-" + firstErr)?.focus();
      return;
    }
    setBusy(true);
    const pw = await hashPw(f.password);
    const partner = PARTNERS[normCode(f.invite)] || UNI_PARTNERS[f.uni.trim()] || null;
    update(() => ({
      ...fresh(),
      session: true,
      partner,
      account: { name: f.name.trim(), uni: f.uni.trim(), year: f.year, email: f.email.trim(), invite: f.invite.trim(), pw },
    }));
    toast(`Account created. Welcome, ${f.name.trim().split(" ")[0]}`);
    router.push("/onboarding/consent");
  }

  const uniPartner = UNI_PARTNERS[f.uni.trim()];
  const uniEmail = /\.ac\.uk$/i.test(f.email.trim());
  const err = (k: keyof Errs) => (errs[k] ? <p className="err" id={`acc-${k}-err`}>{errs[k]}</p> : null);
  const inv = (k: keyof Errs) => (errs[k] ? { "aria-invalid": true, "aria-describedby": `acc-${k}-err` } : {});

  return (
    <div className="col">
      <TopBar note="Step 1 of 4" />
      <form className="pad" onSubmit={submit} noValidate>
        <Link className="back" href="/" style={{ display: "inline-block", textDecoration: "none" }}>‹ Back to site</Link>
        <h1 className="h1">Create your account</h1>
        <p className="lead">Tell us where you study. Some universities and banks give their students Runway for free.</p>

        <div className="fr">
          <label className="lbl" htmlFor="acc-name">Full name</label>
          <input id="acc-name" className="inp" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} {...inv("name")} />
          {err("name")}
        </div>

        <div className="fr">
          <label className="lbl" htmlFor="acc-uni">University</label>
          <input id="acc-uni" className="inp" list="unis" autoComplete="organization" placeholder="Start typing your university" value={f.uni} onChange={(e) => set("uni", e.target.value)} {...inv("uni")} />
          <datalist id="unis">{UNIS.map((u) => <option key={u} value={u} />)}</datalist>
          {errs.uni ? err("uni") : uniPartner ? <p className="hint good">{uniPartner} gives its students Runway for free.</p> : <p className="hint">Pick from the list or type it in full.</p>}
        </div>

        <div className="fr">
          <label className="lbl" htmlFor="acc-year">Year of study</label>
          <select id="acc-year" className="inp" value={f.year} onChange={(e) => set("year", e.target.value)}>
            {YEARS.map((y) => <option key={y}>{y}</option>)}
          </select>
        </div>

        <div className="fr">
          <label className="lbl" htmlFor="acc-email">Email</label>
          <input id="acc-email" className="inp" type="email" inputMode="email" autoComplete="email" placeholder="you@university.ac.uk" value={f.email} onChange={(e) => set("email", e.target.value)} {...inv("email")} />
          {errs.email ? err("email") : uniEmail ? <p className="hint good">University email recognised.</p> : <p className="hint">Your university email works best, but any email is fine.</p>}
        </div>

        <div className="fr">
          <label className="lbl" htmlFor="acc-password">Password</label>
          <div className="pw-wrap">
            <input id="acc-password" className="inp" type={showPw ? "text" : "password"} autoComplete="new-password" value={f.password} onChange={(e) => set("password", e.target.value)} aria-describedby={errs.password ? "acc-password-err" : "pw-hint"} aria-invalid={errs.password ? true : undefined} />
            <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? "Hide" : "Show"}</button>
          </div>
          {errs.password ? err("password") : <p className="hint" id="pw-hint">At least 8 characters, including a number.</p>}
        </div>

        <div className="fr">
          <label className="lbl" htmlFor="acc-invite">Invite code, if you have one</label>
          <input id="acc-invite" className="inp" autoComplete="off" placeholder="For example NATWEST" value={f.invite} onChange={(e) => set("invite", e.target.value)} {...inv("invite")} />
          {err("invite")}
        </div>

        {s.account?.pw && (
          <p className="forgot">There’s already a Runway account on this device. Creating a new one replaces it. <Link href="/signin">Sign in instead</Link></p>
        )}
        <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} disabled={busy}>Create account</button>
        <p className="signup-note">Already have an account? <Link href="/signin">Sign in</Link></p>
        <p className="signup-note">We never sell your data.</p>
      </form>
    </div>
  );
}
