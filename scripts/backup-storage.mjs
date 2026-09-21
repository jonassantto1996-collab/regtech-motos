import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputRoot = path.resolve(process.argv[2] ?? `backups/storage-${stamp}`);
const buckets = ["product-images", "home-media"];
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const manifest = [];

function safeRelative(objectPath) {
  const segments = objectPath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`Caminho de objeto inválido: ${objectPath}`);
  }
  return path.join(...segments);
}

async function downloadObject(bucket, objectPath, metadata) {
  const { data, error } = await supabase.storage.from(bucket).download(objectPath);
  if (error || !data) throw error ?? new Error(`Falha ao baixar ${bucket}/${objectPath}`);

  const destination = path.join(outputRoot, bucket, safeRelative(objectPath));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, Buffer.from(await data.arrayBuffer()));

  manifest.push({
    bucket,
    path: objectPath,
    contentType: metadata?.mimetype ?? "application/octet-stream",
    size: Number(metadata?.size ?? 0),
  });
}

async function walk(bucket, prefix = "") {
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw error;

    for (const item of data ?? []) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id) {
        await downloadObject(bucket, objectPath, item.metadata);
      } else {
        await walk(bucket, objectPath);
      }
    }

    if (!data || data.length < limit) break;
    offset += data.length;
  }
}

await mkdir(outputRoot, { recursive: true });
for (const bucket of buckets) await walk(bucket);

await writeFile(
  path.join(outputRoot, "manifest.json"),
  JSON.stringify({ createdAt: new Date().toISOString(), buckets, objects: manifest }, null, 2)
);

console.log(`Backup concluído: ${manifest.length} objetos em ${outputRoot}`);
