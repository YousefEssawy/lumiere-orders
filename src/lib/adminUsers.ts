// إنشاء مستخدمين من المتصفح (مفيش Admin SDK على GitHub Pages).
// الحيلة: Firebase app ثانوي مؤقت — بينشئ الحساب من غير ما يمس جلسة الأدمن الحالية.
import { deleteApp, getApps, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, signOut } from "firebase/auth";
import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { db, firebaseConfig } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type UserRole } from "@/lib/types";

const SECONDARY_APP_NAME = "user-mgmt";

export interface NewUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

/**
 * بينشئ حساب Auth جديد + ملفه في users.
 * بيرمي AuthError كود زي auth/email-already-in-use أو auth/weak-password.
 */
export async function createUser(
  adminUid: string,
  input: NewUserInput
): Promise<string> {
  if (!db) throw new Error("firebase-not-configured");

  const existing = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  const secondary = existing ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  const secondaryAuth = getAuth(secondary);

  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      input.email.trim(),
      input.password
    );
    const uid = cred.user.uid;
    await signOut(secondaryAuth);

    // الملف بيتكتب بصلاحية الأدمن الحالي (الـ db الرئيسي)
    await setDoc(doc(db, FIRESTORE_COLLECTIONS.users, uid), {
      email: input.email.trim(),
      name: input.name.trim(),
      role: input.role,
      active: true,
      createdAt: serverTimestamp(),
      createdBy: adminUid,
    });
    return uid;
  } finally {
    await deleteApp(secondary).catch(() => {});
  }
}

/** تفعيل / تعطيل مستخدم */
export async function setUserActive(uid: string, active: boolean): Promise<void> {
  if (!db) throw new Error("firebase-not-configured");
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.users, uid), { active });
}

/** تعديل بيانات مستخدم (الاسم والدور — الإيميل ثابت) */
export async function updateUserProfile(
  uid: string,
  changes: { name: string; role: UserRole }
): Promise<void> {
  if (!db) throw new Error("firebase-not-configured");
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.users, uid), {
    name: changes.name.trim(),
    role: changes.role,
  });
}
