"use client";

import AboutPanel from "@/components/AboutPanel";
import { SheetHost, SheetProvider } from "@/components/sheets";

export default function FrameLayout({ children }: { children: React.ReactNode }) {
  return (
    <SheetProvider>
      <div className="shell">
        <AboutPanel />
        <div className="app">
          {children}
          <SheetHost />
        </div>
      </div>
    </SheetProvider>
  );
}
