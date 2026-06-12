"use client";
import { useTranslations } from "next-intl";
import AppShell from "@/components/layout/AppShell";
import PageHero from "@/components/ui/PageHero";

interface HelpSectionProps {
  icon: string;
  title: string;
  items: string[];
  numbered?: boolean;
}

function HelpSection({ icon, title, items, numbered = false }: HelpSectionProps) {
  const List = numbered ? "ol" : "ul";
  return (
    <div className="card">
      <h2 className="text-base font-bold flex items-center gap-2 mb-3">
        <span className="icon text-accent" aria-hidden>{icon}</span>
        {title}
      </h2>
      <List className={"text-sm text-ink-700 space-y-2 ps-5 " + (numbered ? "list-decimal" : "list-disc")}>
        {items.map((item, i) => <li key={i}>{item}</li>)}
      </List>
    </div>
  );
}

function HelpPage() {
  const t = useTranslations("help");

  return (
    <>
      <PageHero icon="help" title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-5 lg:grid-cols-2">
        <HelpSection
          icon="conveyor_belt"
          title={t("flow.title")}
          numbered
          items={[t("flow.s1"), t("flow.s2"), t("flow.s3"), t("flow.s4"), t("flow.s5"), t("flow.s6")]}
        />
        <HelpSection
          icon="rule"
          title={t("rules.title")}
          items={[t("rules.r1"), t("rules.r2"), t("rules.r3"), t("rules.r4"), t("rules.r5"), t("rules.r6")]}
        />
        <HelpSection
          icon="admin_panel_settings"
          title={t("rolesSection.title")}
          items={[t("rolesSection.admin"), t("rolesSection.staff")]}
        />
        <HelpSection
          icon="group"
          title={t("usersSection.title")}
          items={[t("usersSection.u1"), t("usersSection.u2"), t("usersSection.u3"), t("usersSection.u4")]}
        />
        <HelpSection
          icon="language"
          title={t("langSection.title")}
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
