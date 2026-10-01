import test from "node:test";
import assert from "node:assert/strict";
import { resolveAuthBaseUrl } from "../lib/admin/auth-url.ts";

test("produção prioriza domínio configurado",()=>{assert.equal(resolveAuthBaseUrl({configuredUrl:"https://motos.exemplo.com/",vercelUrl:"preview.vercel.app",vercelEnv:"production"}),"https://motos.exemplo.com")});
test("preview usa o próprio deploy",()=>{assert.equal(resolveAuthBaseUrl({configuredUrl:"https://motos.exemplo.com",vercelUrl:"preview-123.vercel.app",vercelEnv:"preview"}),"https://preview-123.vercel.app")});
test("ambiente local aceita localhost",()=>{assert.equal(resolveAuthBaseUrl({configuredUrl:"http://localhost:3000"}),"http://localhost:3000")});
test("URL inválida é ignorada",()=>{assert.equal(resolveAuthBaseUrl({configuredUrl:"javascript:alert(1)"}),null)});
