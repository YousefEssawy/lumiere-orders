"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import { signOut } from "firebase/auth";
import { useTranslations } from "next-intl";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth, type AuthState } from "@/hooks/useAuth";
import type { UserProfile } from "@/lib/types";
import Login from "@/components/Login";
import TopNavBar from "@/components/layout/TopNavBar";
import SideNavBar from "@/components/layout/SideNavBar";

interface SessionCtx {
  profile: UserProfile;
  isAdmin: boolean;
}
const Ctx = createContext<SessionCtx | null>(null);

/** بيانات المستخدم الحالي — متاحة لأي صفحة جوه الـ AppShell */
export function useSession(): SessionCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside <AppShell>");
  return ctx;
}

function CenterNotice({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-5 text-ink-500 text-sm">
      <div className="card max-w-md text-center">{children}</div>
    </div>
  );
}

interface AppShellProps {
  children: ReactNode;
  /** الصفحة دي للأدمن بس؟ */
  adminOnly?: boolean;
}

export default function AppShell({ children, adminOnly = false }: AppShellProps) {
  const t = useTranslations();
  const authState: AuthState = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, isAdmin } = authState;

  if (!isFirebaseConfigured) {
    return (
      <CenterNotice>
        <div className="text-warning text-3xl mb-3">⚠</div>
        {t("auth.setupWarn")}
      </CenterNotice>
    );
  }
  if (user === undefined) return <CenterNotice>{t("common.loading")}</CenterNotice>;
  if (user === null) return <Login />;
  if (profile === undefined) return <CenterNotice>{t("common.loading")}</CenterNotice>;
  if (profile === null) {
    return (
      <CenterNotice>
        {t("auth.noProfile")}
        <div className="mt-4">
          <button className="btn-ghost text-xs" onClick={() => auth && signOut(auth)}>
            {t("nav.logout")}
          </button>
        </div>
      </CenterNotice>
    );
  }
  if (!profile.active) {
    return (
      <CenterNotice>
        {t("auth.inactive")}
        <div className="mt-4">
          <button className="btn-ghost text-xs" onClick={() => auth && signOut(auth)}>
            {t("nav.logout")}
          </button>
        </div>
      </CenterNotice>
    );
  }
  if (adminOnly && !isAdmin) {
    return <CenterNotice>{t("auth.forbidden")}</CenterNotice>;
  }

  return (
    <Ctx.Provider value={{ profile, isAdmin }}>
      <TopNavBar profile={profile} onToggleMenu={() => setMenuOpen((v) => !v)} />
      <SideNavBar isAdmin={isAdmin} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="md:ms-60 p-4 md:p-6 max-w-6xl">{children}</main>
    </Ctx.Provider>
  );
}
