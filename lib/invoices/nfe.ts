import { createHash } from "node:crypto";

export type ParsedNfeItem={lineNumber:number;supplierCode:string|null;ean:string|null;description:string;ncm:string|null;cfop:string|null;unit:string|null;quantity:number;unitValue:number;totalValue:number};
export type ParsedNfe={accessKey:string;invoiceNumber:string;series:string|null;issuerCnpj:string;issuerName:string;issuedAt:string|null;totalAmount:number;xmlHash:string;items:ParsedNfeItem[]};

function decodeXml(value:string){return value.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,"&").trim()}
function tag(block:string,name:string){const re=new RegExp("<(?:[A-Za-z0-9_-]+:)?"+name+"(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?"+name+">","i");const match=block.match(re);return match?decodeXml(match[1].replace(/<[^>]+>/g,"")):null}
function decimal(value:string|null){const parsed=Number((value??"0").replace(",","."));return Number.isFinite(parsed)?parsed:0}

export function parseNfeXml(xml:string):ParsedNfe{
 if(!xml.includes("<")||xml.length<100)throw new Error("invalid_xml");
 const inf=xml.match(/<(?:[A-Za-z0-9_-]+:)?infNFe\b[^>]*\bId=["']NFe([0-9]{44})["'][^>]*>/i);if(!inf)throw new Error("missing_access_key");
 const accessKey=inf[1];
 const emit=xml.match(/<(?:[A-Za-z0-9_-]+:)?emit(?:\s[^>]*)?>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?emit>/i)?.[1]??"";
 const ide=xml.match(/<(?:[A-Za-z0-9_-]+:)?ide(?:\s[^>]*)?>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?ide>/i)?.[1]??"";
 const total=xml.match(/<(?:[A-Za-z0-9_-]+:)?ICMSTot(?:\s[^>]*)?>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?ICMSTot>/i)?.[1]??"";
 const invoiceNumber=tag(ide,"nNF")??"",issuerCnpj=(tag(emit,"CNPJ")??"").replace(/\D/g,""),issuerName=tag(emit,"xNome")??"";
 if(!invoiceNumber||issuerCnpj.length!==14||!issuerName)throw new Error("missing_invoice_fields");
 const items:ParsedNfeItem[]=[];const det=/<(?:[A-Za-z0-9_-]+:)?det\b[^>]*\bnItem=["'](\d+)["'][^>]*>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?det>/gi;let match:RegExpExecArray|null;
 while((match=det.exec(xml))){const lineNumber=Number(match[1]),block=match[2],prod=block.match(/<(?:[A-Za-z0-9_-]+:)?prod(?:\s[^>]*)?>([\s\S]*?)<\/(?:[A-Za-z0-9_-]+:)?prod>/i)?.[1]??block,description=tag(prod,"xProd")??"",quantity=decimal(tag(prod,"qCom"));if(!description||!Number.isInteger(lineNumber)||lineNumber<=0||quantity<=0)continue;const rawEan=tag(prod,"cEAN");items.push({lineNumber,supplierCode:tag(prod,"cProd"),ean:rawEan&&!/^SEM[ -]?GTIN$/i.test(rawEan)?rawEan:null,description,ncm:tag(prod,"NCM"),cfop:tag(prod,"CFOP"),unit:tag(prod,"uCom"),quantity,unitValue:decimal(tag(prod,"vUnCom")),totalValue:decimal(tag(prod,"vProd"))})}
 if(items.length===0)throw new Error("no_items");
 return {accessKey,invoiceNumber,series:tag(ide,"serie"),issuerCnpj,issuerName,issuedAt:tag(ide,"dhEmi")??tag(ide,"dEmi"),totalAmount:decimal(tag(total,"vNF")),xmlHash:createHash("sha256").update(xml).digest("hex"),items};
}
