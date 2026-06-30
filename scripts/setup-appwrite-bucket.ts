/**
 * Ensures the Appwrite storage bucket exists.
 * Usage: npx tsx scripts/setup-appwrite-bucket.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import { Client, Permission, Role, Storage } from "node-appwrite";

function loadEnvFile() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // no .env
  }
}

async function main() {
  loadEnvFile();
  const endpoint = process.env.APPWRITE_ENDPOINT;
  const projectId = process.env.APPWRITE_PROJECT_ID;
  const apiKey = process.env.APPWRITE_API_KEY;
  const bucketId = process.env.APPWRITE_BUCKET_ID ?? "6a4362790030c2e1da0b";

  if (!endpoint || !projectId || !apiKey) {
    throw new Error("Set APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY in .env");
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

  const storage = new Storage(client);

  try {
    const bucket = await storage.getBucket({ bucketId });
    console.log("Bucket already exists:", bucket.name);
    return;
  } catch {
    // create below
  }

  const bucket = await storage.createBucket({
    bucketId,
    name: "Spark Media",
    permissions: [
      Permission.read(Role.any()),
      Permission.create(Role.any()),
    ],
    fileSecurity: false,
    enabled: true,
    maximumFileSize: 100 * 1024 * 1024,
  });

  console.log("Created bucket:", bucket.$id);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
