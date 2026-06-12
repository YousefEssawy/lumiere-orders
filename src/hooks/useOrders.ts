"use client";
import { useEffect, useState, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc,
  updateDoc, writeBatch, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_ORDER_STATUS, FIRESTORE_COLLECTIONS } from "@/lib/types";
import type { Order } from "@/lib/wassalha";

const COL = FIRESTORE_COLLECTIONS.orders;
const ARCHIVE_COL = FIRESTORE_COLLECTIONS.ordersArchive;
// كل أوردر = عمليتين في الأرشفة (إنشاء + حذف)، وحد الـ batch هو 500
const ARCHIVE_CHUNK = 200;

export function useOrders(enabled: boolean) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!enabled || !db) {
      setOrders([]);
      return;
    }
    const q = query(collection(db, COL), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        const arr: Order[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as Omit<Order, "id">) }));
        setOrders(arr);
      },
      () => { /* تجاهل أخطاء الاشتراك */ }
    );
  }, [enabled]);

  const addOrder = useCallback(async (data: Omit<Order, "id" | "createdAt">) => {
    if (!db) return;
    await addDoc(collection(db, COL), { ...data, createdAt: serverTimestamp() });
  }, []);

  const importOrders = useCallback(async (list: Omit<Order, "id" | "createdAt">[]) => {
    if (!db || !list.length) return;
    const database = db;
    const batch = writeBatch(database);
    list.forEach((data) => {
      const ref = doc(collection(database, COL));
      batch.set(ref, { ...data, createdAt: serverTimestamp() });
    });
    await batch.commit();
  }, []);

  const updateOrder = useCallback(async (id: string, data: Omit<Order, "id" | "createdAt">) => {
    if (!db) return;
    await updateDoc(doc(db, COL, id), { ...data });
  }, []);

  const deleteOrder = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  /**
   * «مسح الكل» = أرشفة: بينقل كل الأوردرات لهيستوري ordersArchive
   * بدل الحذف النهائي، مع تسجيل مين أرشف وإمتى.
   */
  const archiveAll = useCallback(async (current: Order[], archivedBy: string) => {
    if (!db || !current.length) return;
    const database = db;
    for (let i = 0; i < current.length; i += ARCHIVE_CHUNK) {
      const chunk = current.slice(i, i + ARCHIVE_CHUNK);
      const batch = writeBatch(database);
      chunk.forEach((o) => {
        if (!o.id) return;
        const { id, ...data } = o;
        batch.set(doc(collection(database, ARCHIVE_COL)), {
          ...data,
          status: DEFAULT_ORDER_STATUS,
          archivedAt: serverTimestamp(),
          archivedBy,
        });
        batch.delete(doc(database, COL, id));
      });
      await batch.commit();
    }
  }, []);

  return { orders, addOrder, importOrders, updateOrder, deleteOrder, archiveAll };
}
