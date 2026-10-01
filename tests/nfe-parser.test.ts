import test from "node:test";import assert from "node:assert/strict";import {parseNfeXml} from "../lib/invoices/nfe.ts";
const xml=`<nfeProc><NFe><infNFe Id="NFe15260912345678000123550010000123451000012345"><ide><nNF>12345</nNF><serie>1</serie><dhEmi>2026-09-20T10:30:00-03:00</dhEmi></ide><emit><CNPJ>12345678000123</CNPJ><xNome>Fornecedor Teste</xNome></emit><det nItem="1"><prod><cProd>ABC123</cProd><cEAN>7891234567890</cEAN><xProd>SMARTPHONE TESTE 128GB PRETO</xProd><NCM>85171300</NCM><CFOP>5102</CFOP><uCom>UN</uCom><qCom>3.0000</qCom><vUnCom>1000.00</vUnCom><vProd>3000.00</vProd></prod></det><total><ICMSTot><vNF>3000.00</vNF></ICMSTot></total></infNFe></NFe></nfeProc>`;
test("parseNfeXml extracts invoice and item data",()=>{const parsed=parseNfeXml(xml);assert.equal(parsed.invoiceNumber,"12345");assert.equal(parsed.issuerCnpj,"12345678000123");assert.equal(parsed.items.length,1);assert.equal(parsed.items[0].supplierCode,"ABC123");assert.equal(parsed.items[0].quantity,3);assert.equal(parsed.totalAmount,3000)});
test("parseNfeXml rejects XML without NFe access key",()=>{assert.throws(()=>parseNfeXml("<xml>invalid</xml>"))});

import {parseNfeDanfeText} from "../lib/invoices/nfe-pdf.ts";

test("parseNfeDanfeText extracts a conservative text DANFE",()=>{
 const text=[
  "FORNECEDOR TESTE LTDA",
  "CNPJ 12.345.678/0001-23",
  "DANFE DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA",
  "Nº 000.012.345",
  "SÉRIE 1",
  "CHAVE DE ACESSO 1526 0912 3456 7800 0123 5500 1000 0123 4510 0001 2345",
  "VALOR TOTAL DA NOTA 3.000,00",
  "ABC123 SMARTPHONE TESTE 128GB PRETO 85171300 5102 UN 3,0000 1.000,00 3.000,00",
 ].join("\n");
 const parsed=parseNfeDanfeText(text,"hash");
 assert.equal(parsed.invoiceNumber,"000012345");
 assert.equal(parsed.issuerCnpj,"12345678000123");
 assert.equal(parsed.items.length,1);
 assert.equal(parsed.items[0].quantity,3);
 assert.equal(parsed.totalAmount,3000);
});
