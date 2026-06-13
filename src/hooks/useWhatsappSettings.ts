"use client";
import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  FIRESTORE_COLLECTIONS, WHATSAPP_SETTINGS_DOC, type WhatsappTemplates,
} from "@/lib/types";
import { updateAudit } from "@/lib/audit";

/**
 * إعدادات قوالب الواتساب — doc واحد ثابت في settings.
 * templates = undefined معناها لسه بتحمّل، {} أو القيم بعد ما توصل.
 */
export function useWhatsappSettings(enabled: boolean) {
  const [templates, setTemplates] = useState<WhatsappTemplates | undefined>(undefined);

  useEffect(() => {
    if (!enabled || !db) return;
    const ref = doc(db, FIRESTORE_COLLECTIONS.settings, WHATSAPP_SETTINGS_DOC);
    return onSnapshot(
      ref,
      (snap) => {
        setTemplates(snap.exists() ? (snap.data().templates ?? {}) : {});
      },
      () => setTemplates({})
    );
  }, [enabled]);

  const saveTemplates = useCallback(async (next: WhatsappTemplates, byUid: string) => {
    if (!db) return;
    const ref = doc(db, FIRESTORE_COLLECTIONS.settings, WHATSAPP_SETTINGS_DOC);
    await setDoc(
      ref,
      { id: WHATSAPP_SETTINGS_DOC, templates: next, ...updateAudit(byUid) },
      { merge: true }
    );
  }, []);

  return { templates, saveTemplates };
}
