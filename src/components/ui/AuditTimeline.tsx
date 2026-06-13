"use client";
import { EMPTY_DISPLAY } from "@/lib/appGlobals";

export interface AuditNodeData {
  icon: string;
  label: string;
  who: string;
  when: string;
}

/**
 * تايملاين بيانات السجل (أنشأه → عدّله → نقله) — بيستخدم في فوتر
 * ديالوجات التفاصيل. النقط الفاضية بتختفي تلقائياً.
 */
export default function AuditTimeline({ nodes }: { nodes: AuditNodeData[] }) {
  const visible = nodes.filter((n) => !(n.who === EMPTY_DISPLAY && n.when === EMPTY_DISPLAY));
  return (
    <ul>
      {visible.map((n, i) => (
        <li key={`${n.label}-${n.who}-${n.when}`} className="relative flex gap-3 pb-4 last:pb-0">
          {i < visible.length - 1 && (
            <span className="absolute start-[11px] top-7 bottom-0 w-px bg-ink-100" aria-hidden />
          )}
          <span className="relative z-10 inline-flex items-center justify-center w-6 h-6 rounded-full bg-canvas border border-line shrink-0">
            <span className="icon !text-[13px] text-ink-500" aria-hidden>{n.icon}</span>
          </span>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs text-ink-500 min-w-0 pt-1">
            <span>{n.label}</span>
            <b className="text-ink-700">{n.who}</b>
            <span className="text-ink-300" dir="ltr">{n.when}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
