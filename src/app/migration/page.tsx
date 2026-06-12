"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { runMigration, type MigrationResult } from "@/lib/migration";
import { logAction } from "@/lib/logger";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import PageHero from "@/components/ui/PageHero";

type Phase = "idle" | "scanning" | "scanned" | "migrating" | "done";

function MigrationPage() {
  const t = useTranslations("migration");
  const { profile } = useSession();
  const flash = useToast();
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState("");
  const actor = { uid: profile.uid, email: profile.email };

  async function handleScan() {
    setError("");
    setPhase("scanning");
    try {
      setResult(await runMigration(true));
      setPhase("scanned");
    } catch (e) {
      setError((e as Error).message);
      setPhase("idle");
    }
  }

  async function handleMigrate() {
    if (!window.confirm(t("confirmRun"))) return;
    setError("");
    setPhase("migrating");
    try {
      const res = await runMigration(false);
      setResult(res);
      setPhase("done");
      flash(t("toast.done"));
      const totalUpdated = res.stats.reduce((s, c) => s + c.updated, 0);
      logAction(actor, "system.migrate", "", totalUpdated);
    } catch (e) {
      setError((e as Error).message);
      setPhase("scanned");
    }
  }

  const busy = phase === "scanning" || phase === "migrating";
  const totalChanges = result?.stats.reduce((s, c) => s + c.updated, 0) ?? 0;

  return (
    <>
      <PageHero icon="build" title={t("title")} subtitle={t("subtitle")} />

      <div className="card fade-up fade-up-delay-1">
        <p className="text-[13px] text-ink-500 leading-relaxed">{t("explain1")}</p>
        <ul className="text-[13px] text-ink-500 leading-relaxed list-disc ps-5 mt-2 space-y-1.5 marker:text-ink-300">
          <li>{t("fix1")}</li>
          <li>{t("fix2")}</li>
        </ul>
        <p className="text-xs text-ink-300 mt-3">{t("logsNote")}</p>

        {error && (
          <div className="text-danger text-[13px] mt-4 break-all" dir="ltr">{error}</div>
        )}

        <div className="flex flex-wrap gap-2.5 mt-5">
          <button className="btn-ghost" onClick={handleScan} disabled={busy}>
            <span className="icon text-base" aria-hidden>search</span>
            {phase === "scanning" ? t("scanning") : t("scanBtn")}
          </button>
          {phase === "scanned" && totalChanges > 0 && (
            <button className="btn-primary" onClick={handleMigrate} disabled={busy}>
              <span className="icon text-base" aria-hidden>play_arrow</span>
              {t("runBtn", { n: totalChanges })}
            </button>
          )}
          {phase === "migrating" && (
            <span className="text-sm text-ink-500 self-center">{t("migrating")}</span>
          )}
        </div>
      </div>

      {result && (
        <div className="table-wrap fade-up mt-5">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("table.collection")}</th>
                <th>{t("table.total")}</th>
                <th>{t("table.missingId")}</th>
                <th>{t("table.emailBy")}</th>
                <th>{t("table.unknown")}</th>
                <th>{t("table.updated")}</th>
              </tr>
            </thead>
            <tbody>
              {result.stats.map((s) => (
                <tr key={s.collection}>
                  <td dir="ltr" className="font-semibold">{s.collection}</td>
                  <td>{s.total}</td>
                  <td>{s.missingId}</td>
                  <td>{s.emailByFixed}</td>
                  <td className={s.emailByUnknown ? "text-warning font-bold" : ""}>{s.emailByUnknown}</td>
                  <td className="font-bold">{s.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-ink-500 border-t border-line">
            {result.dryRun ? t("dryRunNote") : t("doneNote")}
          </div>
        </div>
      )}
    </>
  );
}

export default function Page() {
  return (
    <AppShell adminOnly>
      <MigrationPage />
    </AppShell>
  );
}
