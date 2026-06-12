"use client";
import { useCallback, useEffect, useState } from "react";
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type OrderStatus } from "@/lib/types";
import { updateAudit } from "@/lib/audit";
import type { Order } from "@/lib/wassalha";

const COL = FIRESTORE_COLLECTIONS.ordersArchive;
const DELETE_CHUNK = 450;

export interface ArchivedOrder extends Order {
  status?: OrderStatus;
  archivedAt?: unknown;
  archivedBy?: string;
}

/** هيستوري الأوردرات المؤرشفة — real-time، الأحدث أولاً */
export function useArchive(enabled: boolean) {
  const [archived, setArchived] = useState<ArchivedOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !db) {
      setArchived([]);
      return;
    }
    const q = query(collection(db, COL), orderBy("archivedAt", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        const arr: ArchivedOrder[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as Omit<ArchivedOrder, "id">) }));
        setArchived(arr);
        setError(null);
      },
      (err) => {
        console.error("[lumiere] archive subscription failed:", err);
        setArchived([]);
        setError(err.message);
      }
    );
  }, [enabled]);

  const deleteArchived = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  const setStatus = useCallback(async (id: string, status: OrderStatus, byEmail: string) => {
    if (!db) return;
    await updateDoc(doc(db, COL, id), { status, ...updateAudit(byEmail) });
  }, []);

  const clearArchive = useCallback(async (current: ArchivedOrder[]) => {
    if (!db || !current.length) return;
    const database = db;
    for (let i = 0; i < current.length; i += DELETE_CHUNK) {
      const chunk = current.slice(i, i + DELETE_CHUNK);
      const batch = writeBatch(database);
      chunk.forEach((o) => { if (o.id) batch.delete(doc(database, COL, o.id)); });
      await batch.commit();
    }
  }, []);

  return { archived, error, deleteArchived, clearArchive, setStatus };
}
