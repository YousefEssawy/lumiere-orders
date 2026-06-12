"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type UserProfile } from "@/lib/types";

/** قائمة المستخدمين real-time (للأدمن — الـ rules بتمنع غيره) */
export function useUsers(enabled: boolean): UserProfile[] {
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    if (!enabled || !db) {
      setUsers([]);
      return;
    }
    const q = query(collection(db, FIRESTORE_COLLECTIONS.users), orderBy("createdAt", "asc"));
    return onSnapshot(
      q,
      (snap) => {
        const arr: UserProfile[] = [];
        snap.forEach((d) => arr.push({ uid: d.id, ...(d.data() as Omit<UserProfile, "uid">) }));
        setUsers(arr);
      },
      () => setUsers([])
    );
  }, [enabled]);

  return users;
}
