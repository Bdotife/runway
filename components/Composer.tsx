"use client";

import { useRef, useState } from "react";
import { CHIPS } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { Icon } from "./ui";

export default function Composer({ mode, onSubmit }: { mode: "app" | "onboard"; onSubmit: (q: string) => void }) {
  const { toast } = useStore();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const rec = useRef<any>(null);
  const input = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    setText("");
    onSubmit(q);
  }

  function mic() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast("Voice isn’t available in this browser. Type instead.");
      return;
    }
    if (listening) {
      try {
        rec.current?.stop();
      } catch {
        /* ignore */
      }
      return;
    }
    try {
      const r = new SR();
      r.lang = "en-GB";
      r.interimResults = true;
      rec.current = r;
      r.onresult = (e: any) => setText([...e.results].map((x: any) => x[0].transcript).join(" "));
      r.onerror = (e: any) =>
        toast(e.error === "not-allowed" || e.error === "service-not-allowed" ? "Microphone access is blocked. Type instead." : "Didn’t catch that. Try again or type it.");
      r.onend = () => {
        setListening(false);
        input.current?.focus();
      };
      setListening(true);
      r.start();
    } catch {
      setListening(false);
      toast("Voice isn’t available here. Type instead.");
    }
  }

  return (
    <form className="composer" onSubmit={submit} autoComplete="off">
      {mode === "app" && (
        <div className="chips">
          {CHIPS.map((c) => (
            <button type="button" key={c} className="chip" onClick={() => onSubmit(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
      <div className="row">
        <button type="button" className={`icon-btn ${listening ? "rec" : ""}`} onClick={mic} aria-label={listening ? "Stop listening" : "Speak to Runway"}>
          {Icon.mic}
        </button>
        <label className="sr" htmlFor="ask">
          Message Runway
        </label>
        <input
          id="ask"
          ref={input}
          className="ask"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mode === "app" ? "Log a spend or ask before you buy" : "Type here or tap the mic"}
        />
        <button className="icon-btn send" aria-label="Send">
          {Icon.send}
        </button>
      </div>
    </form>
  );
}
