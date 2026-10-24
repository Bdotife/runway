"use client";

import Link from "next/link";
import { Result, Status, fmtDate, gbp } from "@/lib/engine";

export const Icon = {
  home: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
  ),
  debts: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3 10h18M7 15h4" />
    </svg>
  ),
  me: (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.6-4 4.6-6 8-6s6.4 2 8 6" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
};

export function Brand({ size = 28 }: { size?: number }) {
  return (
    <Link href="/" className="brand brand-btn" aria-label="Runway home" style={{ textDecoration: "none" }}>
      <img src="/logo-mark.png" alt="" width={size} height={size} style={{ width: size, height: size }} />
      <span>Runway</span>
    </Link>
  );
}

export function TopBar({ note }: { note?: React.ReactNode }) {
  return (
    <div className="top">
      <Brand />
      {note ? <span className="top-note">{note}</span> : null}
    </div>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const t = { ok: "On track", tight: "Tight", over: "Runs short" }[status];
  return <span className={`pill ${status}`}>{t}</span>;
}

export function RunwayStrip({ r, nextAmount }: { r: Result; nextAmount: number }) {
  const n = Math.ceil(r.totalWeeks);
  const msg = r.status === "over" ? `Runs out in week ${Math.floor(r.coveredWeeks) + 1}` : `Lasts until ${fmtDate(r.next)}`;
  const cells = Array.from({ length: n }, (_, i) => {
    let cls = "lit";
    if (i < r.weekIdx) cls = "past";
    if (i === r.weekIdx) cls = "now";
    if (i > r.weekIdx && r.status === "over" && i >= Math.floor(r.coveredWeeks)) cls = "gone";
    return <span key={i} className={`week ${cls}`} />;
  });
  return (
    <div className="runway" role="img" aria-label={`Week ${r.weekIdx + 1} of ${n}. ${msg}.`}>
      <div className="strip-top" aria-hidden="true">
        <strong>
          Week {r.weekIdx + 1} of {n}
        </strong>
        <span>{msg}</span>
      </div>
      <div className="lights" aria-hidden="true">
        {cells}
      </div>
      <div className="strip-meta" aria-hidden="true">
        <span>{fmtDate(r.start)}</span>
        <span>
          Next loan {gbp(nextAmount)} on {fmtDate(r.next)}
        </span>
      </div>
    </div>
  );
}

export function MoneyField({ id, label, value, onChange, invalid, describedBy }: { id: string; label: string; value: any; onChange: (v: string) => void; invalid?: boolean; describedBy?: string }) {
  return (
    <div className="fr">
      <label className="lbl" htmlFor={id}>
        {label}
      </label>
      <div className="money-wrap">
        <span>£</span>
        <input id={id} className="inp" inputMode="decimal" placeholder="0" value={value ?? ""} onChange={(e) => onChange(e.target.value)} aria-invalid={invalid || undefined} aria-describedby={describedBy} />
      </div>
    </div>
  );
}

export function SelectField({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: (string | [string, string])[]; onChange: (v: string) => void }) {
  return (
    <div className="fr">
      <label className="lbl" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="inp" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const [v, l] = Array.isArray(o) ? o : [o, o];
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function TextField({ id, label, value, onChange, type = "text", ...rest }: { id: string; label: string; value: any; onChange: (v: string) => void; type?: string } & Record<string, any>) {
  return (
    <div className="fr">
      <label className="lbl" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="inp" type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />
    </div>
  );
}

export function CatRow({ name, val, pct, over, main }: { name: string; val: string; pct: number; over?: boolean; main?: boolean }) {
  return (
    <div className={`cat ${main ? "cat-main" : ""}`}>
      <span className="cat-name">{name}</span>
      <span className="cat-val">{val}</span>
      <span className="bar" aria-hidden="true">
        <i style={{ width: `${pct}%` }} className={over ? "over" : ""} />
      </span>
    </div>
  );
}
