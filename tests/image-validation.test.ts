import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_IMAGE_SIZE_BYTES,
  validateImageFile,
  validateImageSignature,
} from "../lib/supabase/storage.ts";

test("aceita JPEG PNG e WebP dentro do limite", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.deepEqual(validateImageFile({ type, size: 1024 }), { valid: true });
  }
});

test("rejeita MIME não permitido", () => {
  assert.equal(validateImageFile({ type: "image/gif", size: 1024 }).valid, false);
});

test("rejeita arquivo acima de 5 MB", () => {
  assert.equal(validateImageFile({ type: "image/jpeg", size: MAX_IMAGE_SIZE_BYTES + 1 }).valid, false);
});

test("confirma assinatura JPEG", async () => {
  const file = new File([new Uint8Array([0xff,0xd8,0xff,0xe0,0,0,0,0,0,0,0,0])], "foto.jpg", { type: "image/jpeg" });
  assert.deepEqual(await validateImageSignature(file), { valid: true });
});

test("rejeita MIME JPEG com conteúdo PNG", async () => {
  const file = new File([new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,0])], "fraude.jpg", { type: "image/jpeg" });
  assert.equal((await validateImageSignature(file)).valid, false);
});

test("confirma assinatura WebP", async () => {
  const file = new File([new Uint8Array([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50])], "foto.webp", { type: "image/webp" });
  assert.deepEqual(await validateImageSignature(file), { valid: true });
});
