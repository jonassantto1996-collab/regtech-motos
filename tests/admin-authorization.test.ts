import test from "node:test";
import assert from "node:assert/strict";
import { isAuthorizedAdmin } from "../lib/admin/authorization.ts";

test("autoriza somente ADMIN explicitamente ativo",()=>{assert.equal(isAuthorizedAdmin({role:"ADMIN",is_active:true},null),true)});
test("nega usuário ausente",()=>{assert.equal(isAuthorizedAdmin(null,null),false)});
test("nega administrador inativo",()=>{assert.equal(isAuthorizedAdmin({role:"ADMIN",is_active:false},null),false)});
test("nega papel diferente",()=>{assert.equal(isAuthorizedAdmin({role:"USER",is_active:true},null),false)});
test("nega resposta incompleta",()=>{assert.equal(isAuthorizedAdmin({role:"ADMIN"},null),false);assert.equal(isAuthorizedAdmin({is_active:true},null),false)});
test("falha fechada quando consulta de autorização retorna erro",()=>{assert.equal(isAuthorizedAdmin({role:"ADMIN",is_active:true},new Error("db indisponível")),false)});
