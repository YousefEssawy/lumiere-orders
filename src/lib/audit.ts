// Audit entity — بيتحقن في كل عمليات الكتابة عشان كل سجل يحكي قصته:
// مين أنشأه وإمتى، ومين آخر واحد عدّله وإمتى.
import { serverTimestamp } from "firebase/firestore";

export interface AuditFields {
  createdBy?: string; // إيميل المنشئ
  createdAt?: unknown;
  updatedBy?: string; // إيميل آخر معدّل
  updatedAt?: unknown;
}

/** حقول الإنشاء — تتضاف مع أي document جديد */
export function creationAudit(byEmail: string) {
  return {
    createdBy: byEmail,
    createdAt: serverTimestamp(),
    updatedBy: byEmail,
    updatedAt: serverTimestamp(),
  };
}

/** حقول التعديل — تتضاف مع أي update */
export function updateAudit(byEmail: string) {
  return {
    updatedBy: byEmail,
    updatedAt: serverTimestamp(),
  };
}

/** حقول الأرشفة — للأوردرات المنقولة للشحنات */
export function archiveAudit(byEmail: string) {
  return {
    archivedBy: byEmail,
    archivedAt: serverTimestamp(),
  };
}
