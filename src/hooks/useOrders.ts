"use client";
import { useEffect, useState, useCallback } from "react";
import {
  collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc,
  writeBatch, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/lib/wassalha";

const COL = "orders";

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

  const deleteOrder = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  const clearAll = useCallback(async (current: Order[]) => {
    if (!db || !current.length) return;
    const database = db;
    const batch = writeBatch(database);
    current.forEach((o) => { if (o.id) batch.delete(doc(database, COL, o.id)); });
    await batch.commit();
  }, []);

  return { orders, addOrder, importOrders, deleteOrder, clearAll };
}
