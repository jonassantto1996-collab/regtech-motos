import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDocument,
  formatWhatsapp,
  isValidCnpj,
  isValidCpf,
  normalizeWhatsapp,
  parseResellerSignup,
  temporaryPassword,
} from "../lib/store/resellers.ts";

const form = (values: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
};

const valid = {
  contact_name: "Maria Souza",
  store_name: "Cell Center Ourilândia",
  document: "11.222.333/0001-81",
  whatsapp: "(94) 99295-5996",
  city: "Ourilândia do Norte, PA",
  email: "Maria@Loja.com.br",
  password: "senha-forte-1",
};

test("valida CNPJ e CPF", () => {
  assert.equal(isValidCnpj("11.222.333/0001-81"), true);
  assert.equal(isValidCnpj("11.222.333/0001-82"), false);
  assert.equal(isValidCnpj("00000000000000"), false);
  assert.equal(isValidCpf("529.982.247-25"), true);
  assert.equal(isValidCpf("529.982.247-24"), false);
  assert.equal(isValidCpf("11111111111"), false);
});

test("normaliza WhatsApp brasileiro", () => {
  assert.equal(normalizeWhatsapp("(94) 99295-5996"), "94992955996");
  assert.equal(normalizeWhatsapp("+55 94 99295-5996"), "94992955996");
  assert.equal(normalizeWhatsapp("9299295599"), "9299295599");
  assert.equal(normalizeWhatsapp("99295-5996"), null);
  assert.equal(normalizeWhatsapp("(09) 99295-5996"), null);
});

test("formata para mostrar no painel", () => {
  assert.equal(formatDocument("11222333000181"), "11.222.333/0001-81");
  assert.equal(formatDocument("52998224725"), "529.982.247-25");
  assert.equal(formatWhatsapp("94992955996"), "(94) 99295-5996");
});

test("cadastro válido sai limpo", () => {
  const r = parseResellerSignup(form(valid));
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.data.document, "11222333000181");
    assert.equal(r.data.whatsapp, "94992955996");
    assert.equal(r.data.email, "maria@loja.com.br");
  }
});

test("cadastro com erro aponta o motivo", () => {
  assert.deepEqual(parseResellerSignup(form({ ...valid, document: "123" })), { ok: false, error: "invalid_document" });
  assert.deepEqual(parseResellerSignup(form({ ...valid, whatsapp: "123" })), { ok: false, error: "invalid_whatsapp" });
  assert.deepEqual(parseResellerSignup(form({ ...valid, email: "maria" })), { ok: false, error: "invalid_email" });
  assert.deepEqual(parseResellerSignup(form({ ...valid, password: "1234567" })), { ok: false, error: "weak_password" });
  assert.deepEqual(parseResellerSignup(form({ ...valid, store_name: "" })), { ok: false, error: "missing_fields" });
});

test("senha provisória tem 10 caracteres sem letras que confundem", () => {
  let i = 0;
  const pwd = temporaryPassword((max) => (i++ * 7) % max);
  assert.equal(pwd.length, 10);
  assert.equal(/[0OIl1]/.test(pwd), false);
});
