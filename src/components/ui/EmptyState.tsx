"use client";

interface EmptyStateProps {
  icon: string;
  text: string;
}

/** حالة فاضية موحدة — أيقونة جوه دايرة كريمي + نص هادي */
export default function EmptyState({ icon, text }: EmptyStateProps) {
  return (
    <div className="text-center py-14 px-5 text-ink-500">
      <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-soft mb-3">
        <span className="icon !text-[30px] text-ink-300" aria-hidden>{icon}</span>
      </span>
      <div className="text-sm max-w-sm mx-auto">{text}</div>
    </div>
  );
}
