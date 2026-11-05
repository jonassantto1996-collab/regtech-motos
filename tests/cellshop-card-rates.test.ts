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
