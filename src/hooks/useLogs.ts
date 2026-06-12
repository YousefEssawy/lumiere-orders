"use client";
import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS, type LogEntry } from "@/lib/types";

const LOGS_LIMIT = 500;

/** آخر سجلات النشاط real-time (للأدمن — الـ rules بتمنع غيره) */
export function useLogs(enabled: boolean): LogEntry[] {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!enabled || !db) {
      setLogs([]);
      return;
    }
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.logs),
      orderBy("createdAt", "desc"),
      limit(LOGS_LIMIT)
    );
    return onSnapshot(
      q,
      (snap) => {
        const arr: LogEntry[] = [];
        snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as Omit<LogEntry, "id">) }));
        setLogs(arr);
      },
      () => setLogs([])
    );
  }, [enabled]);

  return logs;
}
