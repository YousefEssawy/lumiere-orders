"use client";
import { useCallback, useEffect, useState } from "react";
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type Category } from "@/lib/types";
import { creationAudit, updateAudit } from "@/lib/audit";

const COL = FIRESTORE_COLLECTIONS.categories;

export function useCategories(enabled: boolean) {
  const [categories, setCategories] = useState<Category[]>([]);
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
        const arr: Category[] = [];
        snap.forEach((d) => arr.push({ ...(d.data() as Category), id: d.id }));
        setCategories(arr);
        setError(null);
      },
      (err) => {
        console.error("[lumiere] categories subscription failed:", err);
        setError(err.message);
      }
    );
  }, [enabled]);

  const addCategory = useCallback(async (name: string, byUid: string) => {
    if (!db) return;
    const ref = doc(collection(db, COL));
    await setDoc(ref, { id: ref.id, name: name.trim(), active: true, ...creationAudit(byUid) });
  }, []);

  const updateCategory = useCallback(
    async (id: string, changes: Partial<Pick<Category, "name" | "active">>, byUid: string) => {
      if (!db) return;
      await updateDoc(doc(db, COL, id), { ...changes, ...updateAudit(byUid) });
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  return { categories, error, addCategory, updateCategory, deleteCategory };
}
