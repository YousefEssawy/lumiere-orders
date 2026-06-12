// ترقية البيانات القديمة (one-time):
// 1) كل document ياخد حقل id جواه
// 2) حقول createdBy/updatedBy/archivedBy اللي فيها إيميل تتحول لـ uid
// اللوجز مستثناة — append-only بالـ rules (الجديدة سليمة أصلاً).
import {
  collection, doc, getDocs, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/types";

const BATCH_LIMIT = 400;
const BY_FIELDS = ["createdBy", "updatedBy", "archivedBy"] as const;

export interface CollectionStats {
  collection: string;
  total: number;
  /** documents ناقصها حقل id */
  missingId: number;
  /** حقول *By فيها إيميل واتحوّلت لـ uid */
  emailByFixed: number;
  /** حقول *By فيها إيميل مش معروف (مفيش يوزر بيه) — اتسابت زي ما هي */
  emailByUnknown: number;
  /** documents اتعدلت فعلاً */
  updated: number;
}

export interface MigrationResult {
  stats: CollectionStats[];
  dryRun: boolean;
}

const TARGET_COLLECTIONS = [
  FIRESTORE_COLLECTIONS.orders,
  FIRESTORE_COLLECTIONS.ordersArchive,
  FIRESTORE_COLLECTIONS.users,
] as const;

/** بيجيب خريطة email → uid من users (الأدمن بس يقدر) */
async function buildEmailMap(): Promise<Record<string, string>> {
  if (!db) return {};
  const snap = await getDocs(collection(db, FIRESTORE_COLLECTIONS.users));
  const map: Record<string, string> = {};
  snap.forEach((d) => {
    const email = (d.data() as { email?: string }).email;
    if (email) map[email] = d.id;
  });
  return map;
}

/**
 * بيمسح الـ collections ويصلح (أو يحسب بس لو dryRun).
 * بيرجع إحصائيات لكل collection.
 */
export async function runMigration(dryRun: boolean): Promise<MigrationResult> {
  if (!db) throw new Error("firebase-not-configured");
  const database = db;
  const emailToUid = await buildEmailMap();
  const stats: CollectionStats[] = [];

  for (const colName of TARGET_COLLECTIONS) {
    const snap = await getDocs(collection(database, colName));
    const stat: CollectionStats = {
      collection: colName,
      total: snap.size,
      missingId: 0,
      emailByFixed: 0,
      emailByUnknown: 0,
      updated: 0,
    };

    let batch = writeBatch(database);
    let batchCount = 0;
    const commits: Promise<void>[] = [];

    for (const d of snap.docs) {
      const data = d.data() as Record<string, unknown>;
      const changes: Record<string, unknown> = {};

      if (!data.id) {
        changes.id = d.id;
        stat.missingId++;
      }

      for (const field of BY_FIELDS) {
        const v = data[field];
        if (typeof v === "string" && v.includes("@")) {
          const uid = emailToUid[v];
          if (uid) {
            changes[field] = uid;
            stat.emailByFixed++;
          } else {
            stat.emailByUnknown++;
          }
        }
      }

      if (Object.keys(changes).length) {
        stat.updated++;
        if (!dryRun) {
          batch.update(doc(database, colName, d.id), changes);
          batchCount++;
          if (batchCount >= BATCH_LIMIT) {
            commits.push(batch.commit());
            batch = writeBatch(database);
            batchCount = 0;
          }
        }
      }
    }

    if (!dryRun && batchCount > 0) commits.push(batch.commit());
    await Promise.all(commits);
    stats.push(stat);
  }

  return { stats, dryRun };
}
