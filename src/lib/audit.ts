// Audit entity — بيتحقن في كل عمليات الكتابة عشان كل سجل يحكي قصته:
// مين أنشأه وإمتى، ومين آخر واحد عدّله وإمتى.
// كل حقول *By بتخزن uid المستخدم (المعرف الثابت — الإيميل موجود في users/logs).
import { serverTimestamp } from "firebase/firestore";

export interface AuditFields {
  createdBy?: string; // uid المنشئ
  createdAt?: unknown;
  updatedBy?: string; // uid آخر معدّل
  updatedAt?: unknown;
}

/** حقول الإنشاء — تتضاف مع أي document جديد */
export function creationAudit(byUid: string) {
  return {
    createdBy: byUid,
    createdAt: serverTimestamp(),
    updatedBy: byUid,
    updatedAt: serverTimestamp(),
  };
}

/** حقول التعديل — تتضاف مع أي update */
export function updateAudit(byUid: string) {
  return {
    updatedBy: byUid,
    updatedAt: serverTimestamp(),
  };
}

/** حقول الأرشفة — للأوردرات المنقولة للشحنات */
export function archiveAudit(byUid: string) {
  return {
    archivedBy: byUid,
    archivedAt: serverTimestamp(),
  };
}
