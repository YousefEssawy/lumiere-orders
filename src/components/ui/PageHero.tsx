"use client";
import type { ReactNode } from "react";

interface PageHeroProps {
  icon: string;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

export default function PageHero({ icon, title, subtitle, trailing }: PageHeroProps) {
  return (
    <section className="card fade-up mb-6 flex flex-wrap items-center justify-between gap-4 !py-5">
      <div className="flex items-center gap-3.5 min-w-0">
        <span className="icon-tile">
          <span className="icon text-ink-900 !text-[24px]" aria-hidden>{icon}</span>
        </span>
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {/* الموبايل: الأزرار تحت بعض بعرض كامل (سطر واحد لكل زرار) — الديسكتوب: جنب بعض */}
      {trailing && (
        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2 [&>button]:w-full sm:[&>button]:w-auto">
          {trailing}
        </div>
      )}
    </section>
  );
}
