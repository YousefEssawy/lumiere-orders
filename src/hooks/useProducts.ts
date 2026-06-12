"use client";
import { useCallback, useEffect, useState } from "react";
import {
  collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type Product } from "@/lib/types";
import { creationAudit, updateAudit } from "@/lib/audit";

const COL = FIRESTORE_COLLECTIONS.products;
const IMPORT_CHUNK = 400;

export type ProductInput = Omit<
  Product,
  "id" | "createdAt" | "createdBy" | "updatedAt" | "updatedBy"
>;

/** الـ document id = كود المنتج (uppercase) — يخلي الاستيراد upsert طبيعي */
export function productDocId(code: string): string {
  return code.trim().toUpperCase();
}

export function useProducts(enabled: boolean) {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !db) {
      setProducts([]);
      return;
    }
    const q = query(collection(db, COL), orderBy("code"));
    return onSnapshot(
      q,
      (snap) => {
        const arr: Product[] = [];
        snap.forEach((d) => arr.push({ ...(d.data() as Product), id: d.id }));
        setProducts(arr);
        setError(null);
      },
      (err) => {
        console.error("[lumiere] products subscription failed:", err);
        setError(err.message);
      }
    );
  }, [enabled]);

  const saveProduct = useCallback(
    async (input: ProductInput, byUid: string, isNew: boolean) => {
      if (!db) return;
      const id = productDocId(input.code);
      const ref = doc(db, COL, id);
      if (isNew) {
        await setDoc(ref, { ...input, code: id, id, ...creationAudit(byUid) });
      } else {
        await updateDoc(ref, { ...input, code: id, ...updateAudit(byUid) });
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string) => {
    if (!db) return;
    await deleteDoc(doc(db, COL, id));
  }, []);

  /** استيراد الشيت — upsert بالكود؛ الموجود بيتحدّث والجديد بيتضاف */
  const importProducts = useCallback(
    async (list: ProductInput[], existingIds: Set<string>, byUid: string) => {
      if (!db || !list.length) return;
      const database = db;
      for (let i = 0; i < list.length; i += IMPORT_CHUNK) {
        const chunk = list.slice(i, i + IMPORT_CHUNK);
        const batch = writeBatch(database);
        chunk.forEach((p) => {
          const id = productDocId(p.code);
          const ref = doc(database, COL, id);
          if (existingIds.has(id)) {
            batch.update(ref, { ...p, code: id, ...updateAudit(byUid) });
          } else {
            batch.set(ref, { ...p, code: id, id, ...creationAudit(byUid) });
          }
        });
        await batch.commit();
      }
    },
    []
  );

  return { products, error, saveProduct, deleteProduct, importProducts };
}
