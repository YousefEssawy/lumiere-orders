"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type OrderSourceDoc } from "@/lib/types";
import { creationAudit, updateAudit } from "@/lib/audit";
import { DEFAULT_ORDER_SOURCES, missingDefaultSources } from "@/lib/orderSources";

const COL = FIRESTORE_COLLECTIONS.orderSources;
const DELETE_CHUNK = 450;

export function useOrderSources(enabled: boolean) {
  const [sources, setSources] = useState<OrderSourceDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !db) {
      setSources([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, COL), orderBy("name"));
    return onSnapshot(
      q,
      (snap) => {
        const arr: OrderSourceDoc[] = [];
        snap.forEach((d) => arr.push({ ...(d.data() as OrderSourceDoc), id: d.id }));
        setSources(arr);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[lumiere] order sources subscription failed:", err);
        setError(err.message);
        setLoading(false);
      }
    );
  }, [enabled]);

  /** أسماء المصادر المفعّلة للفورم — الافتراضية لو مفيش مصادر متسجلة */
  const activeNames = useMemo(
    () => (sources.length ? sources : DEFAULT_ORDER_SOURCES).filter((s) => s.active).map((s) => s.name),
    [sources]
  );

  /**
   * زرع المصادر الافتراضية الناقصة بس (بالاسم) بـ ids ثابتة — الموجود
   * مابيتلمسش، فتفعيله/تعطيله بيفضل زي ما هو. بيرجّع أسماء اللي اتضافت.
   */
  const seedDefaults = useCallback(async (byUid: string, existing: OrderSourceDoc[]) => {
    const missing = missingDefaultSources(existing);
    if (!db || !missing.length) return [];
    const database = db;
    const batch = writeBatch(database);
    const takenIds = new Set(existing.map((s) => s.id));
    missing.forEach((s) => {
      // الـ id الثابت ممكن يكون لمصدر افتراضي اتغيّر اسمه — ساعتها id جديد بدل ما نكتب فوقه
      const ref = takenIds.has(s.id) ? doc(collection(database, COL)) : doc(database, COL, s.id);
      batch.set(ref, { ...s, id: ref.id, ...creationAudit(byUid) });
    });
    await batch.commit();
    return missing.map((s) => s.name);
  }, []);

  const addSource = useCallback(async (name: string, byUid: string, active = true) => {
    if (!db) return;
    const ref = doc(collection(db, COL));
    await setDoc(ref, { id: ref.id, name: name.trim(), active, ...creationAudit(byUid) });
  }, []);

  const updateSource = useCallback(
    async (id: string, changes: Partial<Pick<OrderSourceDoc, "name" | "active">>, byUid: string) => {
      if (!db) return;
      await updateDoc(doc(db, COL, id), { ...changes, ...updateAudit(byUid) });
    },
    []
  );

  const deleteSource = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  /** حذف جماعي — مقسّم على دفعات لحد الـ 500 op في الـ batch الواحد */
  const deleteSources = useCallback(async (ids: string[]) => {
    if (!db || !ids.length) return;
    const database = db;
    for (let i = 0; i < ids.length; i += DELETE_CHUNK) {
      const chunk = ids.slice(i, i + DELETE_CHUNK);
      const batch = writeBatch(database);
      chunk.forEach((id) => batch.delete(doc(database, COL, id)));
      await batch.commit();
    }
  }, []);

  return {
    sources, activeNames, error, loading,
    seedDefaults, addSource, updateSource, deleteSource, deleteSources,
  };
}
