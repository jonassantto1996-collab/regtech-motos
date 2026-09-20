import test from "node:test";
import assert from "node:assert/strict";
import { parseProductForm, parseColorsInput, parseSpecsInput } from "../lib/products/validation.ts";

function productForm(overrides: Record<string,string> = {}) {
 const values: Record<string,string>={brand:"Regtech",model:"S1",slug:"",sku:"SKU-1",category:"Scooter",description:"Moto elétrica",price:"9999,90",availability:"Disponível",warranty:"12 meses",colors_json:"[]",specs_json:"[]",...overrides};
 const f=new FormData(); for(const [k,v] of Object.entries(values)) f.set(k,v); return f;
}
test("gera e normaliza slug na criação",()=>{const r=parseProductForm(productForm(),"create");assert.equal(r.ok,true);if(r.ok){assert.equal(r.data.slug,"regtech-s1");assert.equal(r.data.price,9999.9)}});
test("rejeita preço negativo ou inválido",()=>{assert.deepEqual(parseProductForm(productForm({price:"-1"}),"create"),{ok:false,error:"invalid_price"});assert.deepEqual(parseProductForm(productForm({price:"abc"}),"create"),{ok:false,error:"invalid_price"})});
test("exige campos obrigatórios",()=>{assert.deepEqual(parseProductForm(productForm({brand:""}),"create"),{ok:false,error:"missing_fields"})});
test("edição não regenera slug vazio",()=>{assert.deepEqual(parseProductForm(productForm({slug:""}),"edit"),{ok:false,error:"missing_fields"})});
test("rejeita campo acima do limite",()=>{assert.deepEqual(parseProductForm(productForm({brand:"x".repeat(81)}),"create"),{ok:false,error:"field_too_long"})});
test("normaliza cores e rejeita duplicadas",()=>{assert.deepEqual(parseColorsInput(productForm({colors_json:'[" Azul ","Preto"]'})),{ok:true,colors:["Azul","Preto"]});assert.deepEqual(parseColorsInput(productForm({colors_json:'["Azul","Azul"]'})),{ok:false,error:"duplicate_color"})});
test("rejeita JSON inválido de cores",()=>{assert.deepEqual(parseColorsInput(productForm({colors_json:"{"})),{ok:false,error:"invalid_colors"})});
test("normaliza especificações e rejeita chaves duplicadas",()=>{assert.deepEqual(parseSpecsInput(productForm({specs_json:'[{"key":" Motor ","value":" 3000W "}]'})),{ok:true,specs:[{key:"Motor",value:"3000W"}]});assert.deepEqual(parseSpecsInput(productForm({specs_json:'[{"key":"Motor","value":"1"},{"key":"Motor","value":"2"}]'})),{ok:false,error:"duplicate_spec_key"})});
