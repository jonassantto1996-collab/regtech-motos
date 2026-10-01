import test from "node:test";
import assert from "node:assert/strict";
import {parseStoreProductForm,parseStoreVariantForm,parseStockQuantity} from "../lib/store/validation.ts";
function form(values:Record<string,string>){const f=new FormData();for(const [k,v] of Object.entries(values))f.set(k,v);return f}
const base={category_id:"cat-1",brand:"Samsung",name:"Galaxy A55",slug:"",sku:"A55",description:"Celular",price:"1999,90",availability:"Disponível",is_active:"on"};
test("normaliza produto da loja",()=>{const r=parseStoreProductForm(form(base),"create");assert.equal(r.ok,true);if(r.ok){assert.equal(r.data.slug,"samsung-galaxy-a55");assert.equal(r.data.price,1999.9);assert.equal(r.data.is_active,true)}});
test("rejeita produto inválido",()=>{assert.deepEqual(parseStoreProductForm(form({...base,price:"-1"}),"create"),{ok:false,error:"invalid_price"});assert.deepEqual(parseStoreProductForm(form({...base,brand:""}),"create"),{ok:false,error:"missing_fields"})});
test("valida variante e estoque",()=>{const r=parseStoreVariantForm(form({variant_name:"128 GB · Preto",variant_sku:"A55-128-P",variant_price:"2099,90",stock_quantity:"5",low_stock_threshold:"2"}));assert.equal(r.ok,true);if(r.ok){assert.equal(r.data.price,2099.9);assert.equal(r.data.stock_quantity,5)}});
test("rejeita estoque fracionado ou negativo",()=>{assert.deepEqual(parseStoreVariantForm(form({variant_name:"Preto",stock_quantity:"1.5",low_stock_threshold:"2"})),{ok:false,error:"invalid_variant"});assert.deepEqual(parseStockQuantity(form({stock_quantity:"-1"})),{ok:false,error:"invalid_stock"})});
