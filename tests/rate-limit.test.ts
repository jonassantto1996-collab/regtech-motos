import test from "node:test";
import assert from "node:assert/strict";
import { hashRateLimitKey, isRateLimitAllowed } from "../lib/leads/rate-limit.ts";

test("gera hash determinístico sem expor valor original", () => {
 const a=hashRateLimitKey("phone:94999991234","segredo");
 const b=hashRateLimitKey("phone:94999991234","segredo");
 assert.equal(a,b); assert.equal(a.length,64); assert.equal(a.includes("94999991234"),false);
});
test("segredos diferentes geram chaves diferentes",()=>{assert.notEqual(hashRateLimitKey("origin:1.2.3.4","a"),hashRateLimitKey("origin:1.2.3.4","b"))});
test("falha fechada quando segredo não existe",()=>{assert.throws(()=>hashRateLimitKey("phone:x",undefined),/SUPABASE_SERVICE_ROLE_KEY/)});
test("só permite quando RPC retorna true sem erro",()=>{assert.equal(isRateLimitAllowed(true,null),true);assert.equal(isRateLimitAllowed(false,null),false);assert.equal(isRateLimitAllowed(true,new Error("db")),false);assert.equal(isRateLimitAllowed(undefined,null),false)});
