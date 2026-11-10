import test from "node:test";
import assert from "node:assert/strict";
import { CARD_RATES, cardCondition, cardPlan, cardTotal, MAX_INSTALLMENTS } from "../lib/cellshop/pricing.ts";

const product = { price: 1000, wholesale_price: 800, card_price: null, card_installments: null };

test("tabela de tarifas: 1x a 18x", () => {
  assert.equal(MAX_INSTALLMENTS, 18);
  assert.equal(CARD_RATES[0], 4.8);
  assert.equal(CARD_RATES[17], 20.5);
});

test("total no cartão = preço ÷ (1 − taxa)", () => {
  assert.equal(cardTotal(1000, 10), 1142.86);
  assert.equal(cardTotal(1000, 1), 1050.42);
  assert.equal(cardTotal(1000, 18), 1257.86);
  const plan = cardPlan(1000);
  assert.equal(plan.length, 18);
  assert.deepEqual(plan[9], { installments: 10, total: 1142.86, parcel: 114.29 });
});

test("vitrine mostra o 18x; atacado e sem preço não têm cartão", () => {
  assert.deepEqual(cardCondition(product, 1000, "retail"), { installments: 18, total: 1257.86, parcel: 69.88 });
  assert.equal(cardCondition(product, 800, "wholesale"), null);
  assert.equal(cardCondition(product, null, "retail"), null);
});

test("chave de preços: só esconde o varejo do cliente final", async () => {
  const { hidesRetailPrices, stripRetailPrices, variantPrice, cardCondition } = await import("../lib/cellshop/pricing.ts");
  assert.equal(hidesRetailPrices("retail", false), true);
  assert.equal(hidesRetailPrices("retail", true), false);
  assert.equal(hidesRetailPrices("wholesale", false), false);
  const p = stripRetailPrices({ price: 1999, wholesale_price: 1500, card_price: 2300, card_installments: 12, store_product_variants: [{ price: 2199, wholesale_price: 1700 }] });
  assert.equal(p.price, null);
  assert.equal(p.card_price, null);
  assert.equal(p.card_installments, null);
  assert.equal(p.store_product_variants[0].price, null);
  // Sem preço, a versão também cai em "Consulte o valor" e não há parcelamento.
  assert.equal(variantPrice(p, p.store_product_variants[0], "retail"), null);
  assert.equal(cardCondition(p, null, "retail"), null);
});
