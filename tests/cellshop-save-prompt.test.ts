import test from "node:test";
import assert from "node:assert/strict";
import { AWAY_MIN_MS, cameBack, canOfferSave, isExitIntent, OFFER, savedText } from "../lib/cellshop/save-prompt.ts";
import { isReservationActive, needsCall, recoveryMessage, reservationEndsAt } from "../lib/cellshop/cart-recovery.ts";

const base = { itemCount: 2, hasContact: false, wholesale: false, cartOpen: false, done: false };

test("convite: só com itens, sem contato, no varejo, carrinho fechado e uma vez só", () => {
  assert.equal(canOfferSave(base), true);
  assert.equal(canOfferSave({ ...base, itemCount: 0 }), false);
  assert.equal(canOfferSave({ ...base, hasContact: true }), false);
  assert.equal(canOfferSave({ ...base, wholesale: true }), false);
  assert.equal(canOfferSave({ ...base, cartOpen: true }), false);
  assert.equal(canOfferSave({ ...base, done: true }), false);
});

test("convite: mouse saindo pelo topo e volta para a página", () => {
  assert.equal(isExitIntent({ clientY: 0, relatedTarget: null }), true);
  assert.equal(isExitIntent({ clientY: -5, relatedTarget: null }), true);
  assert.equal(isExitIntent({ clientY: 300, relatedTarget: null }), false);
  assert.equal(isExitIntent({ clientY: 0, relatedTarget: {} }), false);
  assert.equal(cameBack(0, 10_000), false);
  assert.equal(cameBack(1_000, 1_000 + AWAY_MIN_MS - 1), false);
  assert.equal(cameBack(1_000, 1_000 + AWAY_MIN_MS), true);
});

test("convite: textos prometem valor e reserva de 24h", () => {
  assert.match(OFFER.title, /valor/i);
  assert.match(OFFER.text, /24h/);
  assert.match(OFFER.consent, /Autorizo/);
  assert.match(savedText("(94) 99999-9999"), /\(94\) 99999-9999.*24h/);
});

test("para chamar: cliente com WhatsApp entra na hora; lojista só depois de 24h", () => {
  const now = Date.parse("2026-11-13T12:00:00Z");
  const fresh = { status: "open", item_count: 1, updated_at: "2026-11-13T11:50:00Z", whatsapp: "94999999999" };
  assert.equal(needsCall(fresh, true, now), true);
  assert.equal(needsCall({ ...fresh, status: "checked_out" }, true, now), false);
  assert.equal(needsCall({ ...fresh, item_count: 0 }, true, now), false);
  assert.equal(needsCall({ ...fresh, whatsapp: null }, true, now), false);
  assert.equal(needsCall({ ...fresh, whatsapp: null, updated_at: "2026-11-12T10:00:00Z" }, true, now), true);
  assert.equal(needsCall({ ...fresh, whatsapp: null, updated_at: "2026-11-12T10:00:00Z" }, false, now), false);
});

test("reserva: 24h a partir da autorização", () => {
  assert.equal(reservationEndsAt(null), null);
  assert.equal(reservationEndsAt("2026-11-13T12:00:00.000Z")?.toISOString(), "2026-11-14T12:00:00.000Z");
  assert.equal(isReservationActive("2026-11-13T12:00:00.000Z", Date.parse("2026-11-14T11:59:00Z")), true);
  assert.equal(isReservationActive("2026-11-13T12:00:00.000Z", Date.parse("2026-11-14T12:01:00Z")), false);
  assert.equal(isReservationActive(null), false);
});

test("mensagem da loja para quem pediu o valor fala da reserva", () => {
  const msg = recoveryMessage("Ana Paula", [{ title: "iPhone 13", variantName: "128 GB", qty: 1, price: 3000 }], 3000, true);
  assert.match(msg, /Olá, Ana!/);
  assert.match(msg, /pediu o valor/);
  assert.match(msg, /reservado por 24h/);
  assert.doesNotMatch(msg, /\u00a0/);
});
