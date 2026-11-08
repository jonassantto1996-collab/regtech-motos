import test from "node:test";
import assert from "node:assert/strict";
import {
  formatPhone,
  isCartToken,
  isStaleCart,
  parseCartContact,
  recoveryMessage,
  sanitizeSyncItems,
  timeAgo,
} from "../lib/cellshop/cart-recovery.ts";

const P1 = "11111111-1111-4111-8111-111111111111";
const V1 = "22222222-2222-4222-8222-222222222222";

test("token do carrinho", () => {
  assert.equal(isCartToken("a".repeat(32)), true);
  assert.equal(isCartToken("ABC"), false);
  assert.equal(isCartToken("x".repeat(20)), false);
  assert.equal(isCartToken(null), false);
});

test("itens do navegador: só ids válidos, sem repetir, quantidade de 1 a 99", () => {
  const items = sanitizeSyncItems([
    { productId: P1, variantId: V1, qty: 500 },
    { productId: P1, variantId: V1, qty: 1 },
    { productId: P1, variantId: "lixo", qty: 0 },
    { productId: "nao-e-id", qty: 1 },
    "texto",
  ]);
  assert.deepEqual(items, [
    { productId: P1, variantId: V1, qty: 99 },
    { productId: P1, variantId: null, qty: 1 },
  ]);
  assert.deepEqual(sanitizeSyncItems("lixo"), []);
});

test("contato: nome, WhatsApp válido e autorização", () => {
  assert.deepEqual(parseCartContact(" Ana  Maria ", "(94) 99295-5996", true), { ok: true, name: "Ana Maria", whatsapp: "94992955996" });
  assert.deepEqual(parseCartContact("Ana", "+55 94 99295-5996", true), { ok: true, name: "Ana", whatsapp: "94992955996" });
  assert.deepEqual(parseCartContact("A", "94992955996", true), { ok: false, error: "name" });
  assert.deepEqual(parseCartContact("Ana", "1234", true), { ok: false, error: "whatsapp" });
  assert.deepEqual(parseCartContact("Ana", "94992955996", false), { ok: false, error: "consent" });
  assert.equal(formatPhone("94992955996"), "(94) 99295-5996");
});

test("parado: aberto, com itens e sem mexer há 24 horas", () => {
  const now = Date.parse("2026-11-07T12:00:00Z");
  assert.equal(isStaleCart({ status: "open", item_count: 2, updated_at: "2026-11-06T11:00:00Z" }, now), true);
  assert.equal(isStaleCart({ status: "open", item_count: 2, updated_at: "2026-11-06T13:00:00Z" }, now), false);
  assert.equal(isStaleCart({ status: "checked_out", item_count: 2, updated_at: "2026-11-01T00:00:00Z" }, now), false);
  assert.equal(isStaleCart({ status: "open", item_count: 0, updated_at: "2026-11-01T00:00:00Z" }, now), false);
  assert.equal(timeAgo("2026-11-05T12:00:00Z", now), "há 2 dias");
  assert.equal(timeAgo("2026-11-07T07:00:00Z", now), "há 5 horas");
});

test("mensagem para chamar o cliente", () => {
  const text = recoveryMessage("Ana Maria", [{ title: "Apple iPhone 13", variantName: "Rosa", qty: 1, price: 1890 }, { title: "Cabo", variantName: null, qty: 2, price: 39 }], 1968);
  assert.match(text, /^Olá, Ana! Aqui é da Regtech Cell Shop/);
  assert.ok(text.includes("• Apple iPhone 13 (Rosa)"));
  assert.ok(text.includes("• 2x Cabo"));
  assert.ok(text.includes("Total: R$ 1.968,00 à vista."));
  assert.ok(!text.includes("\u00a0"));
});
