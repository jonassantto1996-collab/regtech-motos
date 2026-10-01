import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

if (process.env.ALLOW_STORAGE_RESTORE !== "YES") {
  throw new Error("Restauração bloqueada. Defina ALLOW_STORAGE_RESTORE=YES para confirmar a operação.");
}

const backupRootArg = process.argv[2];
if (!backupRootArg) throw new Error("Informe a pasta do backup como argumento.");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias.");
}

const backupRoot = path.resolve(backupRootArg);
const manifest = JSON.parse(await readFile(path.join(backupRoot, "manifest.json"), "utf8"));
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function safeRelative(objectPath) {
  const segments = objectPath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error(`Caminho de objeto inválido: ${objectPath}`);
  }
  return path.join(...segments);
}

for (const object of manifest.objects ?? []) {
  const bytes = await readFile(path.join(backupRoot, object.bucket, safeRelative(object.path)));
  const { error } = await supabase.storage.from(object.bucket).upload(object.path, bytes, {
    upsert: true,
    contentType: object.contentType || "application/octet-stream",
  });
  if (error) throw error;
}

console.log(`Restauração concluída: ${manifest.objects?.length ?? 0} objetos.`);
