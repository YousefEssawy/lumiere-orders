"use client";
import { useCallback, useEffect, useState } from "react";
import {
  collection, deleteDoc, deleteField, doc, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type Fund } from "@/lib/types";
import { creationAudit, updateAudit } from "@/lib/audit";

const COL = FIRESTORE_COLLECTIONS.funds;
const DELETE_CHUNK = 450;

// الحقول الاختيارية: لو اتفضّت عند التعديل لازم تتشال من الـ document
const OPTIONAL_FUND_FIELDS = ["source", "notes"] as const;

export type FundInput = Omit<
  Fund, "id" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy"
>;

export function useFunds(enabled: boolean) {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !db) {
      setFunds([]);
      setLoading(false);
      return;
    }
    // الأحدث إضافةً أولاً
    const q = query(collection(db, COL), orderBy("date", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        const arr: Fund[] = [];
        snap.forEach((d) => arr.push({ ...(d.data() as Fund), id: d.id }));
        setFunds(arr);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[lumiere] funds subscription failed:", err);
        setError(err.message);
        setLoading(false);
      }
    );
  }, [enabled]);

  const saveFund = useCallback(
    async (input: FundInput, byUid: string, id?: string) => {
      if (!db) return;
      if (id) {
        // updateDoc بيدمج بس — فالحقل الاختياري اللي اتفضّى لازم يتشال بـ deleteField
        const patch: Record<string, unknown> = { ...input, ...updateAudit(byUid) };
        for (const k of OPTIONAL_FUND_FIELDS) {
          if (!(k in input)) patch[k] = deleteField();
        }
        await updateDoc(doc(db, COL, id), patch);
      } else {
        const ref = doc(collection(db, COL));
        await setDoc(ref, { ...input, id: ref.id, ...creationAudit(byUid) });
      }
    },
    []
  );

  const deleteFund = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  const deleteFunds = useCallback(async (ids: string[]) => {
    if (!db || !ids.length) return;
    const database = db;
    for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
      const chunk = ids.slice(i, i + DELETE_CHUNK);
      const batch = writeBatch(database);
      chunk.forEach((id) => batch.delete(doc(database, COL, id)));
      await batch.commit();
    }
  }, []);

  return { funds, error, loading, saveFund, deleteFund, deleteFunds };
}
