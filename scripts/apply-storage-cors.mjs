// Applies cors.json to this project's Firebase Storage bucket, so browsers on the listed
// origins can fetch uploaded files directly (the admin panel's in-browser Office previews
// depend on it). Uses the Admin SDK with the service account from .env
// (FIREBASE_ADMIN_SDK_B64), so gsutil/gcloud aren't needed.
//   node scripts/apply-storage-cors.mjs          → replace the bucket's CORS with cors.json
//   node scripts/apply-storage-cors.mjs --check  → only print the bucket's current CORS
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const envFile = path.join(repoRoot, ".env");
if (existsSync(envFile)) process.loadEnvFile(envFile);

if (!process.env.FIREBASE_ADMIN_SDK_B64) {
  console.error("FIREBASE_ADMIN_SDK_B64 is not set (see .env.example).");
  process.exit(1);
}
const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_ADMIN_SDK_B64, "base64").toString("utf8"),
);

const BUCKET_NAME =
  process.env.FIREBASE_STORAGE_BUCKET ||
  process.env.VITE_FIREBASE_STORAGE_BUCKET ||
  `${serviceAccount.project_id}.firebasestorage.app`;

initializeApp({ credential: cert(serviceAccount) });
const bucket = getStorage().bucket(BUCKET_NAME);

if (!process.argv.includes("--check")) {
  const corsConfig = JSON.parse(readFileSync(path.join(repoRoot, "cors.json"), "utf8"));
  await bucket.setMetadata({ cors: corsConfig });
  console.log("Applied cors.json.");
}

const [metadata] = await bucket.getMetadata();
console.log(`CORS on ${BUCKET_NAME}:`);
console.log(JSON.stringify(metadata.cors ?? [], null, 2));
