"use client";
import { useEffect, useState, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot, deleteDoc, doc, setDoc,
  updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_ORDER_STATUS, FIRESTORE_COLLECTIONS } from "@/lib/types";
import { archiveAudit, creationAudit, updateAudit } from "@/lib/audit";
import type { Order } from "@/lib/wassalha";

const COL = FIRESTORE_COLLECTIONS.orders;
const ARCHIVE_COL = FIRESTORE_COLLECTIONS.ordersArchive;
// كل أوردر = عمليتين في الأرشفة (إنشاء + حذف)، وحد الـ batch هو 500
const ARCHIVE_CHUNK = 200;

type OrderData = Omit<Order, "id" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy">;

export function useOrders(enabled: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !db) {
      setOrders([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, COL), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        const arr: Order[] = [];
        snap.forEach((d) => arr.push({ ...(d.data() as Order), id: d.id }));
        setOrders(arr);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[lumiere] orders subscription failed:", err);
        setError(err.message);
        setLoading(false);
      }
    );
  }, [enabled]);

  const addOrder = useCallback(async (data: OrderData, byUid: string) => {
    if (!db) return;
    // الـ id بيتخزن جوه الـ document نفسه كمان
    const ref = doc(collection(db, COL));
    await setDoc(ref, { ...data, id: ref.id, ...creationAudit(byUid) });
  }, []);

  const importOrders = useCallback(async (list: OrderData[], byUid: string) => {
    if (!db || !list.length) return;
    const database = db;
    const batch = writeBatch(database);
    list.forEach((data) => {
      const ref = doc(collection(database, COL));
      batch.set(ref, { ...data, id: ref.id, ...creationAudit(byUid) });
    });
    await batch.commit();
  }, []);

  const updateOrder = useCallback(async (id: string, data: OrderData, byUid: string) => {
    if (!db) return;
    await updateDoc(doc(db, COL, id), { ...data, ...updateAudit(byUid) });
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  /**
   * «نقل للشحنات»: بينقل كل الأوردرات لـ ordersArchive بحالة افتراضية
   * «تحت التجهيز»، مع الاحتفاظ بالـ audit الأصلي + بيانات الأرشفة.
   */
  const archiveAll = useCallback(async (current: Order[], byUid: string) => {
    if (!db || !current.length) return;
    const database = db;
    for (let i = 0; i < current.length; i += ARCHIVE_CHUNK) {
      const chunk = current.slice(i, i + ARCHIVE_CHUNK);
      const batch = writeBatch(database);
      chunk.forEach((o) => {
        if (!o.id) return;
        const { id, ...data } = o;
        const archiveRef = doc(collection(database, ARCHIVE_COL));
        batch.set(archiveRef, {
          ...data,
          id: archiveRef.id,
          status: DEFAULT_ORDER_STATUS,
          ...archiveAudit(byUid),
        });
        batch.delete(doc(database, COL, id));
      });
      await batch.commit();
    }
  }, []);

  return { orders, error, loading, addOrder, importOrders, updateOrder, deleteOrder, archiveAll };
}
