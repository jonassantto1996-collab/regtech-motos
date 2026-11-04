import test from "node:test";
import assert from "node:assert/strict";
import { brl, buildWhatsAppList, buildWhatsAppListCsv, displayName, wholesaleSummary, type WhatsAppListItem } from "../lib/store/whatsapp-list.ts";
import { safeResellerNext } from "../lib/store/resellers.ts";

const item = (over: Partial<WhatsAppListItem> = {}): WhatsAppListItem => ({
  id: "1",
  brand: "Xiaomi",
  name: "Redmi Note 15 5G",
  slug: "xiaomi-redmi-note-15-5g",
  category: "Celulares",
  price: 1299,
  from: false,
  wholesaleOnly: false,
  ...over,
});

test("preço de atacado: produto, versões e consulte", () => {
  assert.deepEqual(wholesaleSummary(95, []), { price: 95, from: false });
  assert.deepEqual(wholesaleSummary(null, []), { price: null, from: false });
  assert.deepEqual(wholesaleSummary("0", []), { price: null, from: false });
  // Versão sem preço próprio herda o do produto; com preço próprio usa o dela.
  assert.deepEqual(wholesaleSummary(1499, [{ wholesale_price: null }, { wholesale_price: 1599 }]), { price: 1499, from: true });
  assert.deepEqual(wholesaleSummary(1499, [{ wholesale_price: null }, { wholesale_price: "" }]), { price: 1499, from: false });
  // Zero na versão = consulte (não entra no "a partir de").
  assert.deepEqual(wholesaleSummary(null, [{ wholesale_price: 0 }, { wholesale_price: 870 }]), { price: 870, from: false });
});

test("nome não repete a marca", () => {
  assert.equal(displayName({ brand: "Xiaomi", name: "Redmi Note 15 5G" }), "Xiaomi Redmi Note 15 5G");
  assert.equal(displayName({ brand: "Baofeng", name: "Baofeng BF-777S" }), "Baofeng BF-777S");
});

test("texto do WhatsApp com preços e links, agrupado por categoria", () => {
  const text = buildWhatsAppList(
    [item(), item({ id: "2", brand: "Oberon", name: "OR-SP18", slug: "oberon-or-sp18", category: "Acessórios", price: 29 }), item({ id: "3", price: null, slug: "x", name: "Poco C81", category: "Celulares" })],
    { baseUrl: "https://regtechcellshop.com.br/", includePrices: true, includeLinks: true, date: "03/11/2026" },
  );
  assert.match(text, /^\*REGTECH CELL SHOP · ATACADO\*\nLista para lojistas · 03\/11\/2026/);
  assert.ok(text.includes(`*CELULARES*\n• Xiaomi Redmi Note 15 5G: *${brl(1299)}*\nhttps://regtechcellshop.com.br/produto/xiaomi-redmi-note-15-5g\n• Xiaomi Poco C81: consulte o valor`));
  assert.ok(text.includes(`*ACESSÓRIOS*\n• Oberon OR-SP18: *R$ 29,00*`));
  assert.ok(text.includes("https://regtechcellshop.com.br/lojista\n"));
  assert.ok(text.endsWith("https://regtechcellshop.com.br/lojista/cadastro"));
  assert.ok(!text.includes(" "));
});

test("texto sem preços e sem links", () => {
  const text = buildWhatsAppList([item({ from: true })], { baseUrl: "https://x.com.br", includePrices: false, includeLinks: false, date: "01/01/2027" });
  assert.ok(text.includes("• Xiaomi Redmi Note 15 5G\n"));
  assert.ok(!text.includes("R$"));
  assert.ok(!text.includes("/produto/"));
});

test("planilha da lista", () => {
  const csv = buildWhatsAppListCsv([item({ wholesaleOnly: true, from: true }), item({ name: "=cmd", price: null })], "https://x.com.br");
  const [header, first, second] = csv.replace("﻿", "").split("\r\n");
  assert.equal(header, "Categoria;Produto;Preço atacado;A partir de;Só atacado;Link");
  assert.equal(first, "Celulares;Xiaomi Redmi Note 15 5G;1299,00;Sim;Sim;https://x.com.br/produto/xiaomi-redmi-note-15-5g");
  assert.ok(second.includes("Consulte"));
});

test("volta só para página de produto depois de entrar", () => {
  assert.equal(safeResellerNext("/produto/xiaomi-redmi-note-15-5g"), "/produto/xiaomi-redmi-note-15-5g");
  assert.equal(safeResellerNext("https://evil.com"), null);
  assert.equal(safeResellerNext("//evil.com/produto/x"), null);
  assert.equal(safeResellerNext("/produto/../admin"), null);
  assert.equal(safeResellerNext(null), null);
});
