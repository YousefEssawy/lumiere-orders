"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/types";

/**
 * دليل المستخدمين: uid أو إيميل → اسم للعرض.
 * الـ *By في الداتا بيخزن uid (وقيم قديمة فيها إيميل) — العرض بيحول
 * الاتنين لاسم المستخدم. fallback: القيمة نفسها لو مش معروفة.
 */
export function useUserDirectory(): (value?: string) => string {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.users),
      (snap) => {
        const next: Record<string, string> = {};
        snap.forEach((d) => {
          const data = d.data() as { name?: string; email?: string };
          const display = data.name || data.email || d.id;
          next[d.id] = display;
          if (data.email) next[data.email] = display;
        });
        setMap(next);
      },
      () => setMap({})
    );
  }, []);

  return useCallback(
    (value?: string) => (value ? map[value] ?? value : ""),
    [map]
  );
}
