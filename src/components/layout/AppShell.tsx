"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
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

// الموبايل بس بيفتكر آخر حالة — الديسكتوب بيفتح دايماً عند التحميل
const SIDENAV_PREF_KEY = "lumiere.sidenav.open";
const DESKTOP_QUERY = "(min-width: 768px)";

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
  const pathname = usePathname();
  const { user, profile, isAdmin } = authState;

  // SSR-safe: مقفول افتراضياً، وبعد الـ hydration الديسكتوب بيفتح
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      setMenuOpen(true);
    } else {
      setMenuOpen(window.localStorage.getItem(SIDENAV_PREF_KEY) === "1");
    }
  }, []);

  // الموبايل بس بيحفظ الحالة
  useEffect(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) {
      window.localStorage.setItem(SIDENAV_PREF_KEY, menuOpen ? "1" : "0");
    }
  }, [menuOpen]);

  // قفل الدرج عند تغيير الصفحة — موبايل بس
  useEffect(() => {
    if (!window.matchMedia(DESKTOP_QUERY).matches) setMenuOpen(false);
  }, [pathname]);

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
      <TopNavBar
        profile={profile}
        onToggleMenu={() => setMenuOpen((v) => !v)}
        menuOpen={menuOpen}
      />
      <SideNavBar isAdmin={isAdmin} open={menuOpen} onClose={() => setMenuOpen(false)} />
      {/* ms = margin-inline-start — بيتبع اتجاه اللغة */}
      <main
        className={
          "pt-24 pb-12 px-4 sm:px-6 transition-[margin] duration-300 ease-standard " +
          (menuOpen ? "md:ms-64" : "md:ms-0")
        }
      >
        {children}
      </main>
    </Ctx.Provider>
  );
}
