"use client";
import { useCallback, useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/types";

/**
 * دليل المستخدمين: uid → اسم للعرض.
 * الـ *By في الداتا بيخزن uid، والعرض بيحوله لاسم المستخدم من هنا.
 * fallback: الإيميل ثم الـ uid نفسه (لقيم قديمة أو يوزر اتشال).
 */
export function useUserDirectory(): (uid?: string) => string {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!db) return;
    return onSnapshot(
      collection(db, FIRESTORE_COLLECTIONS.users),
      (snap) => {
        const next: Record<string, string> = {};
        snap.forEach((d) => {
          const data = d.data() as { name?: string; email?: string };
          next[d.id] = data.name || data.email || d.id;
        });
        setMap(next);
      },
      () => setMap({})
    );
  }, []);

  return useCallback(
    (uid?: string) => (uid ? map[uid] ?? uid : ""),
    [map]
  );
}
