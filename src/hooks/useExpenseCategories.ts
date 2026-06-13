"use client";
import { useCallback, useEffect, useState } from "react";
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type ExpenseCategory } from "@/lib/types";
import { creationAudit, updateAudit } from "@/lib/audit";

const COL = FIRESTORE_COLLECTIONS.expenseCategories;
const DELETE_CHUNK = 450;

export function useExpenseCategories(enabled: boolean) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !db) {
      setCategories([]);
      return;
    }
    const q = query(collection(db, COL), orderBy("name"));
    return onSnapshot(
      q,
      (snap) => {
        const arr: ExpenseCategory[] = [];
        snap.forEach((d) => arr.push({ ...(d.data() as ExpenseCategory), id: d.id }));
        setCategories(arr);
        setError(null);
      },
      (err) => {
        console.error("[lumiere] expense categories subscription failed:", err);
        setError(err.message);
      }
    );
  }, [enabled]);

  const addCategory = useCallback(async (name: string, byUid: string, active = true) => {
    if (!db) return;
    const ref = doc(collection(db, COL));
    await setDoc(ref, { id: ref.id, name: name.trim(), active, ...creationAudit(byUid) });
  }, []);

  const updateCategory = useCallback(
    async (id: string, changes: Partial<Pick<ExpenseCategory, "name" | "active">>, byUid: string) => {
      if (!db) return;
      await updateDoc(doc(db, COL, id), { ...changes, ...updateAudit(byUid) });
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  /** حذف جماعي — مقسّم على دفعات لحد الـ 500 op في الـ batch الواحد */
  const deleteCategories = useCallback(async (ids: string[]) => {
    if (!db || !ids.length) return;
    const database = db;
    for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
      const chunk = ids.slice(i, i + DELETE_CHUNK);
      const batch = writeBatch(database);
      chunk.forEach((id) => batch.delete(doc(database, COL, id)));
      await batch.commit();
    }
  }, []);

  return { categories, error, addCategory, updateCategory, deleteCategory, deleteCategories };
}
