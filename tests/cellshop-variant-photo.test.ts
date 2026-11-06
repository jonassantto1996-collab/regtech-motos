import test from "node:test";
import assert from "node:assert/strict";
import {
  colorOptions,
  defaultVariant,
  initialPhotoIndex,
  photoIndexForColor,
  sameColor,
  variantColor,
} from "../lib/cellshop/variant-photo.ts";

test("cor da versão a partir do nome", () => {
  assert.equal(variantColor("Rosa"), "Rosa");
  assert.equal(variantColor("128 GB · Roxo · Bateria 81%"), "Roxo");
  assert.equal(variantColor("256 GB · 8 GB RAM · Dourado (Lightning Gold)"), "Dourado (Lightning Gold)");
  assert.equal(variantColor("128 GB"), null);
  assert.equal(variantColor("256 GB · 8 GB RAM"), null);
  assert.equal(variantColor(null), null);
});

test("compara cor sem acento e sem parênteses", () => {
  assert.equal(sameColor("Bordô", "bordo"), true);
  assert.equal(sameColor("Dourado (Lightning Gold)", "Dourado"), true);
  assert.equal(sameColor("Preto", "Prateado"), false);
  assert.equal(sameColor(null, "Preto"), false);
});

const photos = [
  { storage_path: "preto.jpg", color: "Preto" },
  { storage_path: "branco.jpg", color: "Branco" },
  { storage_path: "rosa.jpg", color: "Rosa" },
];

test("acha a foto da cor escolhida", () => {
  assert.equal(photoIndexForColor(photos, "Rosa"), 2);
  assert.equal(photoIndexForColor(photos, "Azul"), -1);
  assert.equal(photoIndexForColor(photos, null), -1);
});

test("foto inicial: principal, a não ser que seja de outra cor", () => {
  assert.equal(initialPhotoIndex(photos, "Branco"), 1);
  assert.equal(initialPhotoIndex(photos, "Preto"), 0);
  assert.equal(initialPhotoIndex(photos, "Azul"), 0);
  // Caixa (sem cor) como principal continua sendo a primeira.
  assert.equal(initialPhotoIndex([{ storage_path: "caixa.jpg", color: null }, ...photos], "Rosa"), 0);
});

test("versão marcada e cores para o painel", () => {
  const variants = [
    { name: "512 GB · Preto", stock_quantity: 0 },
    { name: "256 GB · Preto", stock_quantity: 2 },
    { name: "256 GB · Glacial", stock_quantity: 1 },
  ];
  assert.equal(defaultVariant(variants)?.name, "256 GB · Preto");
  assert.equal(defaultVariant([{ name: "A", stock_quantity: 0 }])?.name, "A");
  assert.equal(defaultVariant([]), null);
  assert.deepEqual(colorOptions(variants.map((v) => v.name)), ["Preto", "Glacial"]);
  assert.deepEqual(colorOptions(["128 GB", "256 GB"]), []);
});
