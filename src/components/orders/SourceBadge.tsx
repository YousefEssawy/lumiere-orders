"use client";
import { useTranslations } from "next-intl";
import type { Order } from "@/lib/wassalha";
import { sourceClass } from "@/lib/statusStyles";
import { orderOrigin } from "@/lib/orderSources";
import { EMPTY_DISPLAY } from "@/lib/appGlobals";
import { useSourceLabel } from "@/hooks/useSourceLabel";

const ORIGIN_ICON = { manual: "edit_note", import: "upload_file" } as const;

/** بادج المصدر + أيقونة الأصل (يدوي / استيراد) — نفس الشكل في كل الجداول */
export default function SourceBadge({ order }: { order: Pick<Order, "source" | "origin"> }) {
  const t = useTranslations("orders.origins");
  const sourceLabel = useSourceLabel();
  const origin = orderOrigin(order);

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span className={"pill " + sourceClass(order.source)}>{sourceLabel(order.source) || EMPTY_DISPLAY}</span>
      <span className="icon text-base text-ink-300" translate="no" role="img" title={t(origin)} aria-label={t(origin)}>
        {ORIGIN_ICON[origin]}
      </span>
    </span>
  );
}
