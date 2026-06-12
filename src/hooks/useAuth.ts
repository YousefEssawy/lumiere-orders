"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type UserProfile } from "@/lib/types";

export interface AuthState {
  /** undefined = لسه بيحمّل */
  user: User | null | undefined;
  /** undefined = بيحمّل، null = مفيش ملف للمستخدم في users */
  profile: UserProfile | null | undefined;
  isAdmin: boolean;
}

/**
 * حالة الدخول + ملف المستخدم (الدور والتفعيل) من Firestore.
 * أول دخول للأدمن المؤسس: بيحاول ينشئ ملفه بنفسه — الـ rules
 * بتسمح بده للـ bootstrap admin بس، وأي حد تاني بيترفض بأمان.
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(auth, (u) => setUser(u ?? null));
  }, []);

  useEffect(() => {
    if (!user || !db) {
      setProfile(user === undefined ? undefined : null);
      return;
    }
    const ref = doc(db, FIRESTORE_COLLECTIONS.users, user.uid);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...(snap.data() as Omit<UserProfile, "uid">) });
        } else {
          // محاولة bootstrap — بتنجح للأدمن المؤسس بس (حسب الـ rules)
          setDoc(ref, {
            email: user.email ?? "",
            name: user.email?.split("@")[0] ?? "",
            role: "admin",
            active: true,
            createdAt: serverTimestamp(),
            createdBy: user.uid,
          }).catch(() => setProfile(null));
        }
      },
      () => setProfile(null)
    );
  }, [user]);

  return {
    user,
    profile,
    isAdmin: !!profile && profile.role === "admin" && profile.active,
  };
}
