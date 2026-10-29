export type StoreProductInput={category_id:string;brand:string;name:string;slug:string;sku:string|null;description:string;price:number;wholesale_price:number|null;card_price:number|null;card_installments:number|null;warranty:string;availability:string;is_active:boolean};
export type StoreProductParseResult={ok:true;data:StoreProductInput}|{ok:false;error:string};
export function storeSlugify(text:string){return text.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}

/** Lê um valor em reais do formulário ("1.299,90", "1299.90" ou "1299"). Vazio vira null. */
export function parseMoney(raw:FormDataEntryValue|null):number|null|"invalid"{
 const text=String(raw??"").trim();
 if(!text)return null;
 const normalized=text.includes(",")?text.replace(/\./g,"").replace(",","."):text;
 const value=Number(normalized);
 if(!Number.isFinite(value)||value<0||value>9999999)return "invalid";
 return Math.round(value*100)/100;
}

export function parseStoreProductForm(formData:FormData,mode:"create"|"edit"):StoreProductParseResult{
 const category_id=String(formData.get("category_id")??"").trim(),brand=String(formData.get("brand")??"").trim(),name=String(formData.get("name")??"").trim(),slugInput=String(formData.get("slug")??"").trim(),skuRaw=String(formData.get("sku")??"").trim(),description=String(formData.get("description")??"").trim(),availability=String(formData.get("availability")??"").trim(),warranty=String(formData.get("warranty")??"").trim(),installmentsRaw=String(formData.get("card_installments")??"").trim();
 const price=parseMoney(formData.get("price"));
 if(!category_id||!brand||!name||price===null||!availability)return {ok:false,error:"missing_fields"};
 if(brand.length>80||name.length>160||slugInput.length>180||skuRaw.length>100||description.length>5000||availability.length>80||warranty.length>120)return {ok:false,error:"field_too_long"};
 let slugSource=slugInput;if(!slugSource&&mode==="create")slugSource=brand+" "+name;if(!slugSource)return {ok:false,error:"missing_fields"};const slug=storeSlugify(slugSource);if(!slug)return {ok:false,error:"invalid_slug"};
 const wholesale_price=parseMoney(formData.get("wholesale_price")),card_price=parseMoney(formData.get("card_price"));
 if(price==="invalid"||wholesale_price==="invalid"||card_price==="invalid")return {ok:false,error:"invalid_price"};
 let card_installments:number|null=null;
 if(installmentsRaw){const n=Number(installmentsRaw);if(!Number.isInteger(n)||n<1||n>24)return {ok:false,error:"invalid_installments"};card_installments=n;}
 if((card_price===null)!==(card_installments===null))return {ok:false,error:"card_incomplete"};
 return {ok:true,data:{category_id,brand,name,slug,sku:skuRaw||null,description,price,wholesale_price,card_price,card_installments,warranty,availability,is_active:formData.get("is_active")==="on"}};
}
export type StoreVariantInput={name:string;sku:string|null;price:number|null;wholesale_price:number|null;stock_quantity:number;low_stock_threshold:number};
export type StoreVariantParseResult={ok:true;data:StoreVariantInput}|{ok:false;error:string};
export function parseStoreVariantForm(formData:FormData):StoreVariantParseResult{
 const name=String(formData.get("variant_name")??"").trim(),skuRaw=String(formData.get("variant_sku")??"").trim(),stockRaw=String(formData.get("stock_quantity")??"0").trim(),thresholdRaw=String(formData.get("low_stock_threshold")??"2").trim();
 if(!name)return {ok:false,error:"invalid_variant"};if(name.length>120||skuRaw.length>100)return {ok:false,error:"invalid_variant"};
 const stock=Number(stockRaw),threshold=Number(thresholdRaw),price=parseMoney(formData.get("variant_price")),wholesale=parseMoney(formData.get("variant_wholesale_price"));
 if(!Number.isInteger(stock)||stock<0||!Number.isInteger(threshold)||threshold<0||price==="invalid"||wholesale==="invalid")return {ok:false,error:"invalid_variant"};
 return {ok:true,data:{name,sku:skuRaw||null,price,wholesale_price:wholesale,stock_quantity:stock,low_stock_threshold:threshold}};
}
export function parseVariantPrices(formData:FormData){
 const price=parseMoney(formData.get("variant_price")),wholesale=parseMoney(formData.get("variant_wholesale_price"));
 if(price==="invalid"||wholesale==="invalid")return {ok:false as const,error:"invalid_price"};
 return {ok:true as const,data:{price,wholesale_price:wholesale}};
}
export function parseStockQuantity(formData:FormData){const stock=Number(String(formData.get("stock_quantity")??""));return Number.isInteger(stock)&&stock>=0?{ok:true as const,stock}:{ok:false as const,error:"invalid_stock"}}
