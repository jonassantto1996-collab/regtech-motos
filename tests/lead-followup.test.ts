import test from "node:test";
import assert from "node:assert/strict";
import { buildLeadFollowupMessage, buildLeadFollowupWhatsappLink } from "../lib/leads/followup.ts";

test("follow-up message changes with lead status",()=>{
 const interested=buildLeadFollowupMessage({fullName:"João Silva",productName:"Regtech TUI",status:"INTERESSADO"});
 const sold=buildLeadFollowupMessage({fullName:"João Silva",productName:"Regtech TUI",status:"VENDA_REALIZADA"});
 assert.match(interested,/retomar seu interesse/i);
 assert.match(sold,/tudo certo/i);
 assert.notEqual(interested,sold);
});

test("follow-up WhatsApp link prefixes Brazilian country code when needed",()=>{
 const link=buildLeadFollowupWhatsappLink({whatsapp:"94999991234",fullName:"João Silva",productName:"Regtech TUI",status:"EM_ATENDIMENTO"});
 assert.ok(link?.startsWith("https://wa.me/5594999991234?text="));
});
