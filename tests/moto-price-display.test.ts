import test from "node:test";
import assert from "node:assert/strict";
import { formatCardInstallments, resolvePriceDisplay } from "../lib/catalog/format.ts";

test("modo de preço das motos", () => {
  assert.equal(resolvePriceDisplay(true, "full"), "full");
  assert.equal(resolvePriceDisplay(true, "installments"), "installments");
  assert.equal(resolvePriceDisplay(false, "installments"), "hidden");
  assert.equal(resolvePriceDisplay(undefined, undefined), "full");
  assert.equal(resolvePriceDisplay(true, "qualquer"), "full");
});

test("só parcelado: texto do cartão, sem total", () => {
  const text = formatCardInstallments(10900, 12)?.replace(/\u00a0/g, " ");
  assert.equal(text, "12x de R$ 908,33 no cartão");
  assert.equal(formatCardInstallments(null, 12), null);
});
