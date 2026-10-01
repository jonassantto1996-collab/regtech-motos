import test from "node:test";
import assert from "node:assert/strict";
import { buildWhatsappLink } from "../lib/leads/whatsapp.ts";

test("catalog lead opens the official Regtech Motors WhatsApp", () => {
  const link = buildWhatsappLink({
    leadName: "Jonas da Silva",
    brand: "OUXI",
    model: "GT16",
  });

  assert.ok(link.startsWith("https://wa.me/5594992086088?text="));
  assert.match(decodeURIComponent(link), /OUXI GT16/);
});
