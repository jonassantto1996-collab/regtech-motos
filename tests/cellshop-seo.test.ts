import test from "node:test";
import assert from "node:assert/strict";
import { CELLSHOP_HOURS, categoryFromPath, categoryPage } from "../lib/cellshop/seo.ts";
import { matchesSearch } from "../lib/cellshop/search.ts";

const cats = [
  { id: "1", slug: "iphone", name: "iPhone" },
  { id: "2", slug: "smartphones", name: "Smartphones" },
  { id: "3", slug: "bombox", name: "Boombox e caixas JBL" },
  { id: "4", slug: "tvs", name: "TVs" },
  { id: "5", slug: "produto", name: "Produto" },
];

test("categorias: endereço e título com a cidade", () => {
  const boombox = categoryPage(cats[2]);
  assert.equal(boombox.path, "boombox-jbl");
  assert.equal(boombox.title, "JBL Boombox e caixas de som em Tucumã-PA");
  assert.match(boombox.description, /Tucumã-PA/);
  assert.equal(categoryPage(cats[1]).path, "celulares");
  // Categoria nova, sem texto próprio: usa o nome dela.
  assert.deepEqual([categoryPage(cats[3]).path, categoryPage(cats[3]).title], ["tvs", "TVs em Tucumã-PA"]);
  // Nunca tampa outra página da loja (/produto, /lojista...).
  assert.equal(categoryPage(cats[4]).path, "categoria-produto");
});

test("categorias: acha a categoria pelo endereço", () => {
  assert.equal(categoryFromPath("boombox-jbl", cats)?.id, "3");
  assert.equal(categoryFromPath("CELULARES", cats)?.id, "2");
  assert.equal(categoryFromPath("bombox", cats), null);
  assert.equal(categoryFromPath("qualquer-coisa", cats), null);
});

test("horário da Cell Shop igual ao perfil no Google", () => {
  assert.deepEqual(CELLSHOP_HOURS.map((h) => h.hours), ["07:30 – 18:00", "07:30 – 13:00", "Fechado"]);
});

test("busca: quem digita bombox acha as caixas JBL depois do novo nome", () => {
  const flip = { brand: "JBL", name: "Flip 7", store_product_variants: [] };
  assert.equal(matchesSearch(flip, "bombox", "Boombox e caixas JBL"), true);
  assert.equal(matchesSearch(flip, "caixa de som", "Boombox e caixas JBL"), true);
  assert.equal(matchesSearch({ brand: "Apple", name: "Capa iPhone 15", store_product_variants: [] }, "capa para iphone"), true);
  // Só "de" digitado continua sendo procurado normalmente.
  assert.equal(matchesSearch(flip, "de"), false);
});
