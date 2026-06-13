"use client";
import { useCallback, useEffect, useState } from "react";
import {
  collection, deleteDoc, deleteField, doc, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type Expense } from "@/lib/types";
import { creationAudit, updateAudit } from "@/lib/audit";

const COL = FIRESTORE_COLLECTIONS.expenses;
const DELETE_CHUNK = 450;

// الحقول الاختيارية: لو اتفضّت عند التعديل لازم تتشال من الـ document
const OPTIONAL_EXPENSE_FIELDS = ["vendor", "paymentMethod", "notes"] as const;

export type ExpenseInput = Omit<
  Expense, "id" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy"
>;

export function useExpenses(enabled: boolean) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !db) {
      setExpenses([]);
      return;
    }
    // الأحدث صرفاً أولاً
    const q = query(collection(db, COL), orderBy("date", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        const arr: Expense[] = [];
        snap.forEach((d) => arr.push({ ...(d.data() as Expense), id: d.id }));
        setExpenses(arr);
        setError(null);
      },
      (err) => {
        console.error("[lumiere] expenses subscription failed:", err);
        setError(err.message);
      }
    );
  }, [enabled]);

  const saveExpense = useCallback(
    async (input: ExpenseInput, byUid: string, id?: string) => {
      if (!db) return;
      if (id) {
        // updateDoc بيدمج بس — فالحقل الاختياري اللي اتفضّى لازم يتشال بـ deleteField
        const patch: Record<string, unknown> = { ...input, ...updateAudit(byUid) };
        for (const k of OPTIONAL_EXPENSE_FIELDS) {
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

  const deleteExpense = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  const deleteExpenses = useCallback(async (ids: string[]) => {
    if (!db || !ids.length) return;
    const database = db;
    for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
      const chunk = ids.slice(i, i + DELETE_CHUNK);
      const batch = writeBatch(database);
      chunk.forEach((id) => batch.delete(doc(database, COL, id)));
      await batch.commit();
    }
  }, []);

  return { expenses, error, saveExpense, deleteExpense, deleteExpenses };
}
