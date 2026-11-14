import test from "node:test";
import assert from "node:assert/strict";
import { buildPriceTable, filterPriceTable, groupLabel, isPriceTableToken, normalizeSearch, priceLines, type PriceTableProduct } from "../lib/cellshop/price-table.ts";

const prod = (over: Partial<PriceTableProduct>): PriceTableProduct => ({
  id: "p",
  brand: "Apple",
  name: "iPhone 15",
  category_id: "c1",
  wholesale_price: null,
  wholesale_note: null,
  store_product_images: [],
  store_product_variants: [],
  ...over,
});

test("tabela: link secreto só com 40 a 64 letras minúsculas e números", () => {
  assert.equal(isPriceTableToken("a".repeat(64)), true);
  assert.equal(isPriceTableToken("ab12".repeat(10)), true);
  assert.equal(isPriceTableToken("a".repeat(39)), false);
  assert.equal(isPriceTableToken("A".repeat(64)), false);
  assert.equal(isPriceTableToken("a".repeat(63) + "-"), false);
  assert.equal(isPriceTableToken(null), false);
});

test("tabela: preço sem versões, versões iguais e versões diferentes", () => {
  assert.deepEqual(priceLines(prod({ wholesale_price: "3500" })), [{ label: null, price: 3500 }]);
  assert.deepEqual(priceLines(prod({ wholesale_price: 0 })), []);
  // Cores com o mesmo preço (herdado do produto): um preço só, com as cores juntas.
  assert.deepEqual(
    priceLines(prod({ wholesale_price: 90, store_product_variants: [
      { id: "1", name: "Preto", wholesale_price: null, is_active: true },
      { id: "2", name: "Branco", wholesale_price: null, is_active: true },
    ] })),
    [{ label: "Preto, Branco", price: 90 }],
  );
  // Armazenamentos com preços diferentes: uma linha por versão, do menor para o maior; inativa e zero ficam de fora.
  assert.deepEqual(
    priceLines(prod({ wholesale_price: 3000, store_product_variants: [
      { id: "1", name: "256 GB", wholesale_price: 3600, is_active: true },
      { id: "2", name: "128 GB", wholesale_price: null, is_active: true },
      { id: "3", name: "512 GB", wholesale_price: 4200, is_active: false },
      { id: "4", name: "1 TB", wholesale_price: 0, is_active: true },
    ] })),
    [{ label: "128 GB", price: 3000 }, { label: "256 GB", price: 3600 }],
  );
});

test("tabela: abas na ordem do painel, só com produtos que têm preço de atacado", () => {
  const cats = [{ id: "c1", name: "iPhone" }, { id: "c2", name: "Relógios" }, { id: "c3", name: "Carregadores" }];
  const sections = buildPriceTable(cats, [
    prod({ id: "a", name: "iPhone 15", wholesale_price: 3500, store_product_images: [{ storage_path: "b.png", display_order: 2 }, { storage_path: "a.png", display_order: 1 }] }),
    prod({ id: "b", name: "iPhone 13", wholesale_price: 2500 }),
    prod({ id: "c", name: "Apple Watch", category_id: "c2", wholesale_price: null }),
    prod({ id: "d", brand: "Turbo", name: "Carregador 20W", category_id: "c3", wholesale_price: 35, wholesale_note: " Acima de 10 un.: R$ 32 " }),
  ]);
  assert.deepEqual(sections.map((s) => s.name), ["iPhone", "Carregadores"]);
  assert.deepEqual(sections[0].items.map((i) => i.name), ["iPhone 13", "iPhone 15"]);
  assert.equal(sections[0].items[1].photo, "a.png");
  assert.equal(sections[1].items[0].note, "Acima de 10 un.: R$ 32");
});

test("tabela: busca sem acento, em qualquer ordem", () => {
  assert.equal(normalizeSearch("  Carregador  TURBO Pássaro "), "carregador turbo passaro");
  const sections = buildPriceTable([{ id: "c3", name: "Carregadores" }, { id: "c1", name: "iPhone" }], [
    prod({ id: "d", brand: "Turbo", name: "Carregador 20W USB-C", category_id: "c3", wholesale_price: 35 }),
    prod({ id: "e", brand: "Turbo", name: "Carregador Veicular", category_id: "c3", wholesale_price: 25 }),
    prod({ id: "a", name: "iPhone 15", wholesale_price: 3500 }),
  ]);
  assert.deepEqual(filterPriceTable(sections, "20w carreg").flatMap((s) => s.items.map((i) => i.id)), ["d"]);
  assert.deepEqual(filterPriceTable(sections, "carregadores").flatMap((s) => s.items.map((i) => i.id)), ["d", "e"]);
  assert.deepEqual(filterPriceTable(sections, "iphone").flatMap((s) => s.items.map((i) => i.id)), ["a"]);
  assert.equal(filterPriceTable(sections, "   ").length, 2);
  assert.equal(filterPriceTable(sections, "xbox").length, 0);
});

test("tabela: versões de mesmo preço juntas, sem repetir o armazenamento", () => {
  assert.equal(groupLabel([]), null);
  assert.equal(groupLabel(["128 GB"]), "128 GB");
  assert.equal(groupLabel(["256 GB · Prateado", "256 GB · Preto"]), "256 GB · Prateado, Preto");
  assert.equal(groupLabel(["128 GB · Preto", "256 GB · Preto"]), "128 GB · Preto, 256 GB · Preto");
  assert.deepEqual(
    priceLines(prod({ store_product_variants: [
      { id: "1", name: "256 GB · Prateado", wholesale_price: 8190, is_active: true },
      { id: "2", name: "256 GB · Glacial", wholesale_price: 8500, is_active: true },
      { id: "3", name: "256 GB · Preto", wholesale_price: 8190, is_active: true },
    ] })),
    [{ label: "256 GB · Prateado, Preto", price: 8190 }, { label: "256 GB · Glacial", price: 8500 }],
  );
});
