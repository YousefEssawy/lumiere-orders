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
import EditUserModal from "@/components/users/EditUserModal";
import Toggle from "@/components/ui/Toggle";

function UsersPage() {
  const t = useTranslations("users");
  const { profile } = useSession();
  const users = useUsers(true);
  const flash = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const actor = { uid: profile.uid, email: profile.email };

  async function toggleActive(u: UserProfile) {
    const activating = !u.active;
    if (!activating && !window.confirm(t("confirmDeactivate", { email: u.email }))) return;
    try {
      await setUserActive(u.uid, activating, profile.uid);
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

  function handleEdited(email: string) {
    setEditUser(null);
    flash(t("toast.updated"));
    logAction(actor, "user.update", email);
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
                <th></th>
                <th>{t("name")}</th>
                <th>{t("email")}</th>
                <th>{t("role")}</th>
                <th>{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid} className={u.active ? "" : "opacity-60"}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <button
                        className="btn-ghost text-[13px] px-3 py-1.5"
                        onClick={() => setEditUser(u)}
                        aria-label={t("edit")}
                        title={t("edit")}
                      >
                        <span className="icon text-base" aria-hidden>edit</span>
                      </button>
                      <Toggle
                        checked={u.active}
                        onChange={() => toggleActive(u)}
                        disabled={u.uid === profile.uid}
                        label={u.active ? t("deactivate") : t("activate")}
                      />
                    </div>
                  </td>
                  <td>{u.name}</td>
                  <td dir="ltr">{u.email}</td>
                  <td>
                    <span className={"pill " + (u.role === "admin" ? "bg-pastel-lavender text-ink-700" : "bg-soft text-ink-500")}>
                      {t(`roles.${u.role}`)}
                    </span>
                  </td>
                  <td>
                    <span className={"pill " + (u.active ? "bg-soft text-success" : "bg-soft text-danger")}>
                      {u.active ? t("active") : t("inactive")}
                    </span>
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
      {editUser && (
        <EditUserModal
          user={editUser}
          byUid={profile.uid}
          onSaved={() => handleEdited(editUser.email)}
          onClose={() => setEditUser(null)}
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
