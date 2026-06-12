"use client";
import {
  createContext, useCallback, useContext, useRef, useState, type ReactNode,
} from "react";

const TOAST_MS = 2600;

const Ctx = createContext<(msg: string) => void>(() => {});

/** useToast()("message") — إشعار سريع أسفل الشاشة */
export function useToast(): (msg: string) => void {
  return useContext(Ctx);
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), TOAST_MS);
  }, []);

  return (
    <Ctx.Provider value={flash}>
      {children}
      <div
        aria-live="polite"
        className={
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-[99] rounded-full px-6 py-3 text-sm text-white " +
          "bg-ink-900 shadow-lg transition-opacity duration-300 pointer-events-none " +
          (msg ? "opacity-100" : "opacity-0")
        }
      >
        {msg}
      </div>
    </Ctx.Provider>
  );
}
