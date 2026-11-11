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

test("financiamento pelo banco", async () => {
  const { formatFinancing } = await import("../lib/catalog/format.ts");
  assert.equal(formatFinancing(48), "Financie em até 48x pelo banco");
  assert.equal(formatFinancing(null), null);
  assert.equal(formatFinancing(1), null);
});
