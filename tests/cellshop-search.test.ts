import test from "node:test";
import assert from "node:assert/strict";
import { matchesSearch } from "../lib/cellshop/search.ts";

const p = (brand: string, name: string, variants: string[] = []) => ({ brand, name, store_product_variants: variants.map((name) => ({ name })) });

test("busca sem acento, sem maiúsculas e em todas as palavras", () => {
  assert.equal(matchesSearch(p("Apple", "iPhone 16 Seminovo"), "IPHONE"), true);
  assert.equal(matchesSearch(p("Samsung", "Galaxy A17 5G"), "galaxy a17"), true);
  assert.equal(matchesSearch(p("Samsung", "Galaxy A07"), "galaxy a17"), false);
  assert.equal(matchesSearch(p("A'Gold", "Cartão de Memória"), "cartao memoria"), true);
  assert.equal(matchesSearch(p("Xiaomi", "Redmi 15C"), ""), true);
});

test("busca também pela categoria e pelas versões", () => {
  assert.equal(matchesSearch(p("Newion", "Cabo Inversor NCB-6504"), "starlink", "Starlink"), true);
  assert.equal(matchesSearch(p("Apple", "iPhone 17", ["256 GB · Preto"]), "256"), true);
});

test("apelidos: apple, tablet, celular", () => {
  assert.equal(matchesSearch(p("Apple", "iPad 11"), "tablet", "iPad e Tablets"), true);
  assert.equal(matchesSearch(p("Xiaomi", "Redmi A5"), "celular", "Smartphones"), true);
  assert.equal(matchesSearch(p("JBL", "Flip 7"), "celular", "Bombox"), false);
});

test("referência: só o número, sem traço ou pelo código interno", () => {
  const cabo = p("Newion", "Cabo Inversor para Starlink Mini 3 m NCB-6504");
  assert.equal(matchesSearch(cabo, "6504"), true);
  assert.equal(matchesSearch(cabo, "ncb6504"), true);
  assert.equal(matchesSearch(cabo, "NCB 6504"), true);
  assert.equal(matchesSearch(cabo, "6505"), false);
  assert.equal(matchesSearch({ ...p("Multilaser", "Cartão de Memória 32GB"), sku: "MC-504" }, "504"), true);
});
