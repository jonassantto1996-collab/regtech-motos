import test from "node:test";
import assert from "node:assert/strict";
import {
  CELLSHOP_RESELLER_SITE_MESSAGE,
  CELLSHOP_SITE_MESSAGE,
  CELLSHOP_SITE_PHRASE,
  MOTORS_SITE_MESSAGE,
  MOTORS_SITE_PHRASE,
  withWhatsappMessage,
} from "../lib/analytics/whatsapp-message.ts";
import { buildWhatsappLink } from "../lib/leads/whatsapp.ts";

test("botões gerais abrem o WhatsApp com a frase do site", () => {
  const motos = withWhatsappMessage("https://wa.me/5594992086088", MOTORS_SITE_MESSAGE);
  assert.ok(motos.startsWith("https://wa.me/5594992086088?text="));
  assert.ok(decodeURIComponent(motos).includes(MOTORS_SITE_PHRASE));

  const loja = withWhatsappMessage("https://wa.me/5594992989833", CELLSHOP_SITE_MESSAGE);
  assert.ok(decodeURIComponent(loja).includes(CELLSHOP_SITE_PHRASE));
  assert.ok(CELLSHOP_RESELLER_SITE_MESSAGE.includes(CELLSHOP_SITE_PHRASE));
});

test("link que já tem mensagem fica como está", () => {
  const pronto = "https://wa.me/5594992989833?text=Ol%C3%A1";
  assert.equal(withWhatsappMessage(pronto, CELLSHOP_SITE_MESSAGE), pronto);
});

test("mensagem da ficha de interesse das motos também tem a frase do site", () => {
  const link = buildWhatsappLink({ leadName: "Jonas", brand: "OUXI", model: "GT16" });
  assert.ok(decodeURIComponent(link).includes(MOTORS_SITE_PHRASE));
});
