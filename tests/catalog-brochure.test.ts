import test from "node:test";
import assert from "node:assert/strict";
import { brochurePrice, categoryTitle, colorSwatch, moneyParts, paginate, parseBrochureMode } from "../lib/catalog/brochure.ts";

test("varejo: 10x sem juros sobre o preço à vista", () => {
  assert.deepEqual(brochurePrice("varejo", { price: 9900 }), { kind: "varejo", total: 9900, installment: 990 });
  assert.deepEqual(brochurePrice("varejo", { price: "6975" }), { kind: "varejo", total: 6975, installment: 697.5 });
  assert.deepEqual(brochurePrice("varejo", { price: 0 }), { kind: "consulte" });
});

test("atacado: usa só o preço de atacado", () => {
  assert.deepEqual(brochurePrice("atacado", { price: 9900, wholesale_price: "8200" }), { kind: "atacado", price: 8200 });
  assert.deepEqual(brochurePrice("atacado", { price: 9900, wholesale_price: null }), { kind: "consulte" });
  assert.equal(parseBrochureMode("atacado"), "atacado");
  assert.equal(parseBrochureMode("qualquer"), "varejo");
});

test("número grande do preço", () => {
  assert.deepEqual(moneyParts(697.5), { reais: "697", cents: "50" });
  assert.deepEqual(moneyParts(9900), { reais: "9.900", cents: "00" });
});

test("cores do catálogo", () => {
  assert.deepEqual(colorSwatch("Vermelho").colors, ["#c8102e"]);
  assert.deepEqual(colorSwatch("Branca com Laranja").colors, ["#f4f4f4", "#f26b1d"]);
  assert.deepEqual(colorSwatch("Vermelho/ Branco").colors, ["#c8102e", "#f4f4f4"]);
  assert.deepEqual(colorSwatch("Cinza azulado").colors, ["#7c8ea3"]);
});

test("páginas de 3 motos, elétricas primeiro", () => {
  const motos = [
    { id: 1, category: "Combustão" },
    { id: 2, category: "Elétrica" },
    { id: 3, category: "Elétrica" },
    { id: 4, category: "Elétrica" },
    { id: 5, category: "Elétrica" },
  ];
  const pages = paginate(motos);
  assert.deepEqual(pages.map((p) => [p.title, p.items.map((i) => i.id)]), [
    ["Motos Elétricas", [2, 3, 4]],
    ["Motos Elétricas", [5]],
    ["Motos a Combustão", [1]],
  ]);
  assert.equal(categoryTitle("Elétrica"), "Motos Elétricas");
});

test("sem preços: nenhuma moto mostra valor", () => {
  assert.equal(parseBrochureMode("consulta"), "consulta");
  assert.deepEqual(brochurePrice("consulta", { price: 9900, wholesale_price: 8200 }), { kind: "consulte" });
});
