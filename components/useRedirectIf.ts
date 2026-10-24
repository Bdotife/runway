"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { nextPath } from "@/lib/engine";
import { useStore } from "@/lib/store";

/** Sends people to the right step if the current page isn't one they should see. */
export function useGuard(allowed: (target: string) => boolean) {
  const { s, ready } = useStore();
  const router = useRouter();
  const target = ready ? nextPath(s) : null;
  const ok = target !== null && allowed(target);
  useEffect(() => {
    if (target && !allowed(target)) router.replace(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return ok;
}
