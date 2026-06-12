// تسجيل النشاط — كل عملية بتتسجل في logs (append-only بالـ rules)
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type LogAction } from "@/lib/types";

export interface LogActor {
  uid: string;
  email: string;
}

/**
 * بيسجل العملية ومبيرميش أخطاء — فشل اللوج ميكسرش العملية الأساسية.
 */
export async function logAction(
  actor: LogActor,
  action: LogAction,
  detail: string,
  count?: number
): Promise<void> {
  if (!db) return;
  try {
    await addDoc(collection(db, FIRESTORE_COLLECTIONS.logs), {
      uid: actor.uid,
      email: actor.email,
      action,
      detail,
      ...(count !== undefined ? { count } : {}),
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // متعمد: فشل اللوج ميكسرش العملية — بس لازم يبان في الكونسول
    console.warn("[lumiere] log write failed:", action, e);
  }
}
