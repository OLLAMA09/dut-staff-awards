// Repairs nominations whose timestamps were saved as {_methodName: "serverTimestamp"}
// instead of a date (a bug in the nomination form's payload cleaning, fixed 2026-09-29).
// Firestore records when each document was created and last written, so the real times
// can be restored exactly: createdAt from the document's create time, and updatedAt /
// mergedAt from its last update time. Uses FIREBASE_ADMIN_SDK_B64 from .env.
//   node scripts/repair-nomination-dates.mjs          → dry run: list what would change
//   node scripts/repair-nomination-dates.mjs --apply  → write the repaired dates
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envFile = path.join(repoRoot, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

if (!process.env.FIREBASE_ADMIN_SDK_B64) {
  console.error("FIREBASE_ADMIN_SDK_B64 is not set (see .env.example).");
  process.exit(1);
}
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_ADMIN_SDK_B64, "base64").toString("utf8"),
);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const apply = process.argv.includes("--apply");

const isBrokenTimestamp = (value) =>
  value !== null &&
  typeof value === "object" &&
  Object.keys(value).length === 1 &&
  value._methodName === "serverTimestamp";

const snapshot = await db.collection("nominations").get();
let repaired = 0;
for (const doc of snapshot.docs) {
  const data = doc.data();
  const fixes = {};
  if (isBrokenTimestamp(data.createdAt)) fixes.createdAt = doc.createTime;
  for (const field of ["updatedAt", "mergedAt"]) {
    if (isBrokenTimestamp(data[field])) fixes[field] = doc.updateTime;
  }
  if (Object.keys(fixes).length === 0) continue;

  repaired += 1;
  const summary = Object.entries(fixes)
    .map(([field, ts]) => `${field} → ${ts.toDate().toISOString()}`)
    .join(", ");
  console.log(`${doc.id} (${data.nomineeName ?? "?"}, ${data.categoryId ?? "?"}): ${summary}`);
  if (apply) await doc.ref.update(fixes);
}

console.log(
  repaired === 0
    ? "No broken dates found."
    : apply
      ? `Repaired ${repaired} nomination(s).`
      : `${repaired} nomination(s) would be repaired. Re-run with --apply to write.`,
);
