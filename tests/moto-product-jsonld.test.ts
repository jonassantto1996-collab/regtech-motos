import test from "node:test";
import assert from "node:assert/strict";
import { motoAvailabilitySchema, motoProductJsonLd } from "../lib/seo/product-jsonld.ts";

const moto = {
  brand: "Honda",
  model: "CG 160",
  slug: "honda-cg-160",
  category: "Street",
  description: "Moto nova",
  price: 18990,
  availability: "Disponível",
};
const siteUrl = "https://regtechmotors.com.br";

test("moto com preço: Product sempre leva offers", () => {
  const ld = motoProductJsonLd(moto, { siteUrl, showPrices: true, imageUrl: "https://x/img.jpg" });
  assert.ok(ld);
  const offers = ld.offers as Record<string, unknown>;
  assert.equal(offers["@type"], "Offer");
  assert.equal(offers.price, "18990.00");
  assert.equal(offers.priceCurrency, "BRL");
  assert.equal(offers.availability, "https://schema.org/InStock");
  assert.equal(offers.url, `${siteUrl}/products/honda-cg-160`);
});

test("preço oculto ou inválido: sem bloco Product (evita erro crítico no Google)", () => {
  assert.equal(motoProductJsonLd(moto, { siteUrl, showPrices: false }), null);
  assert.equal(motoProductJsonLd({ ...moto, price: 0 }, { siteUrl, showPrices: true }), null);
  assert.equal(motoProductJsonLd({ ...moto, price: null }, { siteUrl, showPrices: true }), null);
  assert.equal(motoProductJsonLd({ ...moto, price: Number.NaN }, { siteUrl, showPrices: true }), null);
});

test("disponibilidade da moto", () => {
  assert.equal(motoAvailabilitySchema("Indisponível"), "https://schema.org/OutOfStock");
  assert.equal(motoAvailabilitySchema(" disponível "), "https://schema.org/InStock");
  assert.equal(motoAvailabilitySchema("Sob encomenda"), undefined);
  assert.equal(motoAvailabilitySchema(null), undefined);
});
