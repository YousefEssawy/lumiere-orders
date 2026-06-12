"use client";
import { useTranslations } from "next-intl";
import { ORDER_STATUSES } from "@/lib/types";
import { STATUS_CLASS } from "@/lib/statusStyles";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/ui/PageHero";

const FLOW_STEPS = ["s1", "s2", "s3", "s4", "s5"] as const;
const FLOW_ICONS: Record<(typeof FLOW_STEPS)[number], string> = {
  s1: "inbox",
  s2: "edit_note",
  s3: "local_shipping",
  s4: "download",
  s5: "flag_circle",
};


function FlowTimeline() {
  const t = useTranslations("help.flow");
  return (
    <div className="card fade-up fade-up-delay-1">
      <h2 className="text-base font-bold flex items-center gap-2 mb-5">
        <span className="icon text-accent" aria-hidden>conveyor_belt</span>
        {t("title")}
      </h2>
      <ol className="relative">
        {FLOW_STEPS.map((step, i) => (
          <li key={step} className="relative flex gap-4 pb-7 last:pb-0">
            {/* الخط الواصل — بيتقطع عند آخر خطوة */}
            {i < FLOW_STEPS.length - 1 && (
              <span
                className="absolute start-[19px] top-10 bottom-0 w-px"
                style={{ background: "var(--grad-hero)" }}
                aria-hidden
              />
            )}
            <span className="relative z-10 inline-flex items-center justify-center w-10 h-10 rounded-full bg-ink-900 text-white shrink-0 shadow-sm">
              <span className="icon !text-[20px]" aria-hidden>{FLOW_ICONS[step]}</span>
            </span>
            <div className="pt-0.5 min-w-0">
              <div className="text-sm font-bold text-ink-900">
                <span className="text-ink-300 me-1.5">{i + 1}.</span>
                {t(`steps.${step}.title`)}
              </div>
              <p className="text-[13px] text-ink-500 mt-1 leading-relaxed">
                {t(`steps.${step}.body`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StatusLegend() {
  const t = useTranslations("help.statuses");
  const tStatuses = useTranslations("history.statuses");
  return (
    <div className="card fade-up fade-up-delay-2">
      <h2 className="text-base font-bold flex items-center gap-2 mb-4">
        <span className="icon text-accent" aria-hidden>label</span>
        {t("title")}
      </h2>
      <ul className="space-y-3.5">
        {ORDER_STATUSES.map((s) => (
          <li key={s} className="flex items-start gap-3">
            <span className={"pill shrink-0 mt-0.5 " + STATUS_CLASS[s]}>{tStatuses(s)}</span>
            <span className="text-[13px] text-ink-500 leading-relaxed">{t(s)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface HelpSectionProps {
  icon: string;
  title: string;
  items: string[];
  delayClass?: string;
}

function HelpSection({ icon, title, items, delayClass = "" }: HelpSectionProps) {
  return (
    <div className={`card fade-up ${delayClass}`}>
      <h2 className="text-base font-bold flex items-center gap-2 mb-3">
        <span className="icon text-accent" aria-hidden>{icon}</span>
        {title}
      </h2>
      <ul className="text-[13px] text-ink-500 leading-relaxed space-y-2.5 list-disc ps-5 marker:text-ink-300">
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </ul>
    </div>
  );
}

function HelpPage() {
  const t = useTranslations("help");

  return (
    <>
      <PageHero icon="help" title={t("title")} subtitle={t("subtitle")} />
      {/* masonry: الكروت بتترص ورا بعض في عمودين من غير فجوات بين الصفوف */}
      <div className="columns-1 lg:columns-2 gap-5 [&>*]:break-inside-avoid [&>*]:mb-5">
        <FlowTimeline />
        <StatusLegend />
        <HelpSection
          icon="inventory_2"
          title={t("catalogSection.title")}
          delayClass="fade-up-delay-2"
          items={[
            t("catalogSection.c1"), t("catalogSection.c2"), t("catalogSection.c3"),
            t("catalogSection.c4"), t("catalogSection.c5"),
          ]}
        />
        <HelpSection
          icon="rule"
          title={t("rules.title")}
          delayClass="fade-up-delay-3"
          items={[t("rules.r1"), t("rules.r2"), t("rules.r3"), t("rules.r4"), t("rules.r5"), t("rules.r6")]}
        />
        <HelpSection
          icon="admin_panel_settings"
          title={t("rolesSection.title")}
          delayClass="fade-up-delay-2"
          items={[t("rolesSection.admin"), t("rolesSection.staff")]}
        />
        <HelpSection
          icon="group"
          title={t("usersSection.title")}
          delayClass="fade-up-delay-3"
          items={[
            t("usersSection.u1"), t("usersSection.u2"), t("usersSection.u3"),
            t("usersSection.u4"), t("usersSection.u5"),
          ]}
        />
        <HelpSection
          icon="language"
          title={t("langSection.title")}
          delayClass="fade-up-delay-3"
          items={[t("langSection.l1")]}
        />
      </div>
    </>
  );
}

export default function Page() {
  return (
    <AppShell>
      <HelpPage />
    </AppShell>
  );
}
