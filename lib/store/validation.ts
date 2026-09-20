export type StoreProductInput={category_id:string;brand:string;name:string;slug:string;sku:string|null;description:string;price:number;availability:string;is_active:boolean};
export type StoreProductParseResult={ok:true;data:StoreProductInput}|{ok:false;error:string};
export function storeSlugify(text:string){return text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")}
export function parseStoreProductForm(formData:FormData,mode:"create"|"edit"):StoreProductParseResult{
 const category_id=String(formData.get("category_id")??"").trim(),brand=String(formData.get("brand")??"").trim(),name=String(formData.get("name")??"").trim(),slugInput=String(formData.get("slug")??"").trim(),skuRaw=String(formData.get("sku")??"").trim(),description=String(formData.get("description")??"").trim(),priceRaw=String(formData.get("price")??"").trim(),availability=String(formData.get("availability")??"").trim();
 if(!category_id||!brand||!name||!priceRaw||!availability)return {ok:false,error:"missing_fields"};
 if(brand.length>80||name.length>160||slugInput.length>180||skuRaw.length>100||description.length>5000||availability.length>80)return {ok:false,error:"field_too_long"};
 let slugSource=slugInput;if(!slugSource&&mode==="create")slugSource=brand+" "+name;if(!slugSource)return {ok:false,error:"missing_fields"};const slug=storeSlugify(slugSource);if(!slug)return {ok:false,error:"invalid_slug"};
 const price=Number(priceRaw.replace(",","."));if(!Number.isFinite(price)||price<0)return {ok:false,error:"invalid_price"};
 return {ok:true,data:{category_id,brand,name,slug,sku:skuRaw||null,description,price:Math.round(price*100)/100,availability,is_active:formData.get("is_active")==="on"}};
}