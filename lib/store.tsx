"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { STORAGE_KEY, State, fresh } from "./engine";

type Store = {
  s: State;
  ready: boolean;
  /** Mutate a copy of the state; return a whole new state to replace it. */
  update: (fn: (draft: State) => State | void) => void;
  reset: () => void;
  toast: (text: string) => void;
};

const Ctx = createContext<Store | null>(null);

/** Set before leaving the app on purpose (sign out, delete) so route guards don’t redirect mid-navigation. */
export const navFlags = { leaving: false };

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>(fresh);
  const [ready, setReady] = useState(false);
  const [toastText, setToastText] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setS({ ...fresh(), ...JSON.parse(raw) });
    } catch {
      /* storage unavailable: start fresh */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }, [s, ready]);

  const update = useCallback((fn: (draft: State) => State | void) => {
    setS((prev) => {
      const copy: State = JSON.parse(JSON.stringify(prev));
      const out = fn(copy);
      return out || copy;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setS(fresh());
  }, []);

  const toast = useCallback((text: string) => {
    setToastText(text);
    setToastOn(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastOn(false), 2800);
  }, []);

  return (
    <Ctx.Provider value={{ s, ready, update, reset, toast }}>
      {children}
      <div className={`toast ${toastOn ? "show" : ""}`} role="status" aria-live="polite">
        {toastText}
      </div>
    </Ctx.Provider>
  );
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}
