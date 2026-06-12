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
    <section className="card mb-6 flex flex-wrap items-center justify-between gap-4 !py-5">
      <div className="flex items-center gap-3 min-w-0">
        <span className="icon text-accent !text-[26px]" aria-hidden>{icon}</span>
        <div>
          <h1 className="text-lg font-bold">{title}</h1>
          {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {trailing && <div className="w-full sm:w-auto flex gap-2">{trailing}</div>}
    </section>
  );
}
