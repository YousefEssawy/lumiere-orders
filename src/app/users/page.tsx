"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useUsers } from "@/hooks/useUsers";
import { setUserActive } from "@/lib/adminUsers";
import { logAction } from "@/lib/logger";
import type { UserProfile } from "@/lib/types";
import AppShell, { useSession } from "@/components/layout/AppShell";
import { useToast } from "@/components/ToastProvider";
import PageHero from "@/components/ui/PageHero";
import CreateUserModal from "@/components/users/CreateUserModal";

function UsersPage() {
  const t = useTranslations("users");
  const { profile } = useSession();
  const users = useUsers(true);
  const flash = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const actor = { uid: profile.uid, email: profile.email };

  async function toggleActive(u: UserProfile) {
    const activating = !u.active;
    if (!activating && !window.confirm(t("confirmDeactivate", { email: u.email }))) return;
    try {
      await setUserActive(u.uid, activating);
      flash(t("toast.updated"));
      logAction(actor, activating ? "user.activate" : "user.deactivate", u.email);
    } catch {
      flash(t("toast.updateErr"));
    }
  }

  function handleCreated(email: string) {
    setShowCreate(false);
    flash(t("toast.created", { email }));
    logAction(actor, "user.create", email);
  }

  return (
    <>
      <PageHero
        icon="group"
        title={t("title")}
        subtitle={t("subtitle")}
        trailing={
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <span className="icon text-base" aria-hidden>person_add</span>
            {t("create")}
          </button>
        }
      />

      <div className="table-wrap">
        {users.length === 0 ? (
          <div className="text-center py-12 px-5 text-ink-500 text-sm">{t("table.empty")}</div>
        ) : (
          <table className="data-table min-w-[640px]">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("email")}</th>
                <th>{t("role")}</th>
                <th>{t("status")}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className={u.active ? "" : "opacity-60"}>
                  <td>{u.name}</td>
                  <td dir="ltr">{u.email}</td>
                  <td>
                    <span className={"pill " + (u.role === "admin" ? "bg-soft text-accent" : "bg-soft text-ink-500")}>
                      {t(`roles.${u.role}`)}
                    </span>
                  </td>
                  <td>
                    <span className={"pill " + (u.active ? "bg-soft text-success" : "bg-soft text-danger")}>
                      {u.active ? t("active") : t("inactive")}
                    </span>
                  </td>
                  <td>
                    {u.uid !== profile.uid && (
                      <button
                        className={u.active ? "btn-danger-soft text-[13px]" : "btn-ghost text-[13px] px-3 py-1.5"}
                        onClick={() => toggleActive(u)}
                      >
                        {u.active ? t("deactivate") : t("activate")}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="text-xs text-ink-300 mt-3">{t("deleteNote")}</div>

      {showCreate && (
        <CreateUserModal
          adminUid={profile.uid}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  );
}

export default function Page() {
  return (
    <AppShell adminOnly>
      <UsersPage />
    </AppShell>
  );
}
