import test from "node:test";
import assert from "node:assert/strict";
import { addItem, buildCartMessage, cartTotals, parseStoredCart, removeItem, setQty, type NewCartItem } from "../lib/cellshop/cart.ts";

const iphone: NewCartItem = { productId: "p1", variantId: "v1", slug: "apple-iphone-17", title: "Apple iPhone 17", variantName: "256 GB", price: 5000, imagePath: null };
const cabo: NewCartItem = { productId: "p2", variantId: null, slug: "mi-cabo", title: "Mi Cabo USB-C", variantName: null, price: 39, imagePath: null };
const consulta: NewCartItem = { productId: "p3", variantId: null, slug: "x", title: "Produto X", variantName: null, price: null, imagePath: null };

test("adiciona, soma a mesma versão e separa versões diferentes", () => {
  let items = addItem([], iphone);
  items = addItem(items, iphone, 2);
  assert.equal(items.length, 1);
  assert.equal(items[0].qty, 3);
  items = addItem(items, { ...iphone, variantId: "v2", variantName: "512 GB" });
  assert.equal(items.length, 2);
});

test("quantidade: limite de 1 a 99, zero remove", () => {
  let items = addItem([], cabo);
  items = setQty(items, items[0].key, 500);
  assert.equal(items[0].qty, 99);
  items = setQty(items, items[0].key, 0);
  assert.equal(items.length, 0);
  items = removeItem(addItem([], cabo), "p2:-");
  assert.equal(items.length, 0);
});

test("totais: soma, item sem preço e cartão só no varejo", () => {
  const items = addItem(addItem(addItem([], iphone), cabo, 2), consulta);
  const retail = cartTotals(items, "retail");
  assert.equal(retail.count, 4);
  assert.equal(retail.total, 5078);
  assert.equal(retail.hasUnpriced, true);
  assert.equal(retail.card?.installments, 18);
  assert.equal(cartTotals(items, "wholesale").card, null);
  assert.equal(cartTotals([], "retail").card, null);
});

test("mensagem do WhatsApp com todos os itens e o total", () => {
  const items = addItem(addItem([], iphone), cabo, 2);
  const text = buildCartMessage(items, { mode: "retail", baseUrl: "https://regtechcellshop.com.br/", installments: 10 });
  assert.match(text, /^Olá! Montei este pedido/);
  assert.ok(text.includes("1. Apple iPhone 17 (256 GB): R$ 5.000,00"));
  assert.ok(text.includes("2. 2x Mi Cabo USB-C: 2 x R$ 39,00 = R$ 78,00"));
  assert.ok(text.includes("https://regtechcellshop.com.br/produto/apple-iphone-17"));
  assert.ok(text.includes("Total: R$ 5.078,00 à vista"));
  assert.ok(text.includes("No cartão: 10x de R$ 580,34 (total R$ 5.803,43)"));
  assert.ok(!text.includes(" "));
});

test("mensagem do lojista vai como pedido de atacado, sem cartão", () => {
  const text = buildCartMessage(addItem([], cabo, 10), { mode: "wholesale", baseUrl: "https://x.com.br", resellerName: "Cell Center", installments: 10 });
  assert.match(text, /^Olá! Sou da Cell Center \(lojista\)/);
  assert.ok(text.includes("no atacado"));
  assert.ok(!text.includes("No cartão"));
});

test("carrinho guardado: ignora dados estranhos", () => {
  assert.deepEqual(parseStoredCart("lixo"), []);
  assert.deepEqual(parseStoredCart('{"a":1}'), []);
  const items = parseStoredCart(JSON.stringify([{ productId: "p2", variantId: null, slug: "mi-cabo", title: "Mi", qty: 1000, price: -5 }, { foo: 1 }]));
  assert.equal(items.length, 1);
  assert.equal(items[0].qty, 99);
  assert.equal(items[0].price, null);
});
