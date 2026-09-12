/**
 * Firestore helpers for the `past_winners` collection.
 *
 * Schema (each document in "past_winners"):
 *   id            string   – Firestore auto-id
 *   year          number   – award year (e.g. 2025)
 *   name          string   – winner / entity name
 *   categoryId    string   – matches AWARD_CATEGORIES id
 *   categoryName  string   – denormalised display name
 *   department    string   – department / unit (optional)
 *   quote         string   – inspiring quote (optional)
 *   tier          "platinum"|"gold"|"silver"|"standard"
 *   imageBase64   string   – data URL (base64 encoded photo, optional)
 *   imageMimeType string   – e.g. "image/jpeg"
 *   nominationId  string   – link to source nomination (if promoted)
 *   createdAt     Timestamp
 *   updatedAt     Timestamp
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  getDocs,
  where,
  and,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PAST_WINNERS, AWARD_CATEGORIES } from "@/data/awards";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type WinnerTier = "platinum" | "gold" | "silver" | "standard";

export type PastWinner = {
  id: string;
  year: number;
  name: string;
  categoryId: string;
  categoryName: string;
  department?: string;
  quote?: string;
  tier: WinnerTier;
  imageBase64?: string;
  imageMimeType?: string;
  nominationId?: string;
  createdAt?: { toDate?: () => Date } | null;
  updatedAt?: { toDate?: () => Date } | null;
};

export type PastWinnerInput = Omit<PastWinner, "id" | "createdAt" | "updatedAt">;

const COL = "past_winners";

// ─── Subscribe (real-time) ─────────────────────────────────────────────────────

export function subscribePastWinners(callback: (winners: PastWinner[]) => void): () => void {
  const q = query(collection(db, COL), orderBy("year", "desc"));
  return onSnapshot(q, (snap) => {
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PastWinner);
    callback(docs);
  });
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function addPastWinner(data: PastWinnerInput): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updatePastWinner(id: string, data: Partial<PastWinnerInput>): Promise<void> {
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deletePastWinner(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

// ─── Promote from leaderboard ──────────────────────────────────────────────────

export async function promoteToWinner(opts: {
  nominationId: string;
  nomineeName: string;
  categoryId: string;
  categoryName: string;
  department?: string;
  year: number;
  tier: WinnerTier;
}): Promise<string> {
  return addPastWinner({
    year: opts.year,
    name: opts.nomineeName,
    categoryId: opts.categoryId,
    categoryName: opts.categoryName,
    department: opts.department,
    tier: opts.tier,
    nominationId: opts.nominationId,
  });
}

// ─── Seed (idempotent) ────────────────────────────────────────────────────────

/**
 * Seeds the static PAST_WINNERS array into Firestore. PAST_WINNERS is empty
 * until real Registrar's Ambit winners are supplied — safe to call multiple
 * times, checks for existing records by year + name + categoryId first.
 */
export async function seedPastWinners(): Promise<{ added: number; skipped: number }> {
  // Map category names to ids for records that only have a display name.
  function catIdFromName(name: string): string {
    const match = AWARD_CATEGORIES.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() ||
             c.name.toLowerCase().includes(name.toLowerCase().split(" ")[0].toLowerCase())
    );
    return match?.id ?? name;
  }

  const seeds: PastWinnerInput[] = PAST_WINNERS.map((w) => ({
    year: w.year,
    name: w.name,
    categoryId: catIdFromName(w.category),
    categoryName: w.category,
    department: w.department,
    quote: w.quote,
    tier: "standard" as WinnerTier,
  }));

  let added = 0;
  let skipped = 0;

  for (const seed of seeds) {
    // Idempotency check: look for existing doc with same year + name + categoryId.
    const existing = await getDocs(
      query(
        collection(db, COL),
        and(
          where("year", "==", seed.year),
          where("name", "==", seed.name),
          where("categoryId", "==", seed.categoryId),
        ),
      ),
    );
    if (!existing.empty) {
      skipped++;
      continue;
    }
    await addDoc(collection(db, COL), {
      ...seed,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    added++;
  }

  return { added, skipped };
}
