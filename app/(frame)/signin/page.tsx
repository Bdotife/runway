"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/ui";
import { useGuard } from "@/components/useRedirectIf";
import { hashPw, nextPath } from "@/lib/engine";
import { useStore } from "@/lib/store";

export default function SigninPage() {
  const { s, ready, update, toast } = useStore();
  const router = useRouter();
  const ok = useGuard((t) => t === "/signup" || t === "/signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [errs, setErrs] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (ready && s.account?.email) setEmail(s.account.email);
  }, [ready, s.account?.email]);

  if (!ok) return <div className="col" />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    const er: typeof errs = {};
    if (!em) er.email = "Enter your email.";
    if (!password) er.password = "Enter your password.";
    if (!er.email && (!s.account?.pw || s.account.email.trim().toLowerCase() !== em)) er.email = "There’s no Runway account with this email on this device.";
    if (Object.keys(er).length) {
      setErrs(er);
      document.getElementById(er.email ? "si-email" : "si-password")?.focus();
      return;
    }
    const h = await hashPw(password);
    if (h !== s.account!.pw) {
      setErrs({ password: "That password isn’t right. Try again." });
      document.getElementById("si-password")?.focus();
      return;
    }
    update((x) => {
      x.session = true;
    });
    toast(`Welcome back, ${s.account!.name.split(" ")[0]}`);
    router.push(nextPath({ ...s, session: true }));
  }

  return (
    <div className="col">
      <TopBar note="Sign in" />
      <form className="pad" onSubmit={submit} noValidate>
        <Link className="back" href="/" style={{ display: "inline-block", textDecoration: "none" }}>‹ Back to site</Link>
        <h1 className="h1">Welcome back</h1>
        <p className="lead">Sign in to see this week’s number.</p>
        <div className="fr">
          <label className="lbl" htmlFor="si-email">Email</label>
          <input
            id="si-email" className="inp" type="email" inputMode="email" autoComplete="email" value={email}
            onChange={(e) => { setEmail(e.target.value); setErrs((x) => ({ ...x, email: undefined })); }}
            aria-invalid={errs.email ? true : undefined} aria-describedby={errs.email ? "si-email-err" : undefined}
          />
          {errs.email && <p className="err" id="si-email-err">{errs.email}</p>}
        </div>
        <div className="fr">
          <label className="lbl" htmlFor="si-password">Password</label>
          <div className="pw-wrap">
            <input
              id="si-password" className="inp" type={showPw ? "text" : "password"} autoComplete="current-password" value={password}
              onChange={(e) => { setPassword(e.target.value); setErrs((x) => ({ ...x, password: undefined })); }}
              aria-invalid={errs.password ? true : undefined} aria-describedby={errs.password ? "si-password-err" : undefined}
            />
            <button type="button" className="pw-toggle" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? "Hide" : "Show"}</button>
          </div>
          {errs.password && <p className="err" id="si-password-err">{errs.password}</p>}
        </div>
        <button className="btn btn-primary btn-block">Sign in</button>
        <p className="signup-note">
          <button type="button" className="link inline" onClick={() => setForgot((v) => !v)} aria-expanded={forgot}>Forgot your password?</button>
        </p>
        {forgot && (
          <p className="forgot">This prototype keeps your account in this browser, so it can’t email you a reset link yet. To start again, <Link href="/signup">create a new account</Link>. It replaces the one on this device.</p>
        )}
        <p className="signup-note">New to Runway? <Link href="/signup">Create an account</Link></p>
      </form>
    </div>
  );
}
