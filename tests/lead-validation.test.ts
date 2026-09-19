import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAndValidateName, normalizeAndValidateWhatsapp } from "../lib/leads/validation.ts";

test("normaliza nome completo", () => {
  assert.deepEqual(normalizeAndValidateName("  Jonas   Santos "), { valid: true, value: "Jonas Santos" });
});
test("rejeita nome sem sobrenome", () => {
  assert.equal(normalizeAndValidateName("Jonas").valid, false);
});
test("normaliza WhatsApp removendo máscara", () => {
  assert.deepEqual(normalizeAndValidateWhatsapp("(94) 99999-1234"), { valid: true, value: "94999991234" });
});
test("rejeita WhatsApp curto", () => {
  assert.equal(normalizeAndValidateWhatsapp("12345").valid, false);
});
