"use client";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalShellProps {
  icon: string;
  title: string;
  /** عنصر في يمين الهيدر (مثلاً Toggle التفعيل) */
  trailing?: ReactNode;
  onClose: () => void;
  /** يمنع الإغلاق بالضغط على الخلفية (أثناء الحفظ) */
  locked?: boolean;
  /** عرض الديالوج — الافتراضي max-w-lg */
  widthClass?: string;
  children: ReactNode;
}

/**
 * الهيكل الموحد لكل ديالوجات النظام: خلفية معتمة + شريط هولوجرافيك +
 * هيدر بأيقونة في بلاطة باستيل. المحتوى (فورم أو عرض) جوه children.
 */
export default function ModalShell({
  icon, title, trailing, onClose, locked = false, widthClass = "max-w-lg", children,
}: ModalShellProps) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !locked) onClose(); }}
    >
      <div className={`card !p-0 overflow-hidden w-full ${widthClass} shadow-lg max-h-[90vh] overflow-y-auto fade-up`}>
        <div className="h-1.5 w-full" style={{ background: "var(--grad-hero)" }} aria-hidden />
        <div className="flex items-center justify-between gap-3 px-6 pt-5">
          <h2 className="text-base font-bold flex items-center gap-2.5 min-w-0">
            <span className="icon-tile !w-9 !h-9">
              <span className="icon text-ink-900 !text-[20px]" aria-hidden>{icon}</span>
            </span>
            <span className="truncate">{title}</span>
          </h2>
          {trailing}
        </div>
        <div className="px-6 pb-6 pt-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}
