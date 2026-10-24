"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Composer from "@/components/Composer";
import { useSheet } from "@/components/sheets";
import { Brand, Icon } from "@/components/ui";
import { fmtDate, nextPath } from "@/lib/engine";
import { navFlags, useStore } from "@/lib/store";

const TABS = [
  { href: "/home", label: "Home", icon: Icon.home },
  { href: "/debts", label: "Debts", icon: Icon.debts },
  { href: "/account", label: "You", icon: Icon.me },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { s, ready } = useStore();
  const { fromText } = useSheet();
  const router = useRouter();
  const path = usePathname();
  const target = ready ? nextPath(s) : null;

  useEffect(() => {
    if (target && target !== "/home" && !navFlags.leaving) router.replace(target);
  }, [target, router]);

  if (!ready || target !== "/home") return <div className="col" />;

  return (
    <div className="col">
      <header className="top">
        <Brand />
        <span className="top-note">{s.partner ? `Free through ${s.partner}` : `Next loan ${fmtDate(s.profile!.nextDate)}`}</span>
      </header>
      <main className="main" key={path}>
        {children}
      </main>
      {path !== "/account" && <Composer mode="app" onSubmit={fromText} />}
      <nav className="nav" aria-label="Main">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined} className="nav-link">
            {t.icon}
            <span>{t.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
