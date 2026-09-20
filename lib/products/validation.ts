export type ParsedProduct = {
  brand: string; model: string; slug: string; sku: string | null; category: string;
  description: string; price: number; availability: string; warranty: string;
  pickup_available: boolean; is_active: boolean;
};
export type ParseResult = { ok: true; data: ParsedProduct } | { ok: false; error: string };
export type ColorsParseResult = { ok: true; colors: string[] } | { ok: false; error: string };
export type SpecEntry = { key: string; value: string };
export type SpecsParseResult = { ok: true; specs: SpecEntry[] } | { ok: false; error: string };

export function slugify(text: string): string {
 return text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
export function parseProductForm(formData: FormData, mode: "create"|"edit"): ParseResult {
 const brand=String(formData.get("brand")??"").trim(), model=String(formData.get("model")??"").trim(), slugInput=String(formData.get("slug")??"").trim(), skuRaw=String(formData.get("sku")??"").trim(), category=String(formData.get("category")??"").trim(), description=String(formData.get("description")??"").trim(), priceRaw=String(formData.get("price")??"").trim(), availability=String(formData.get("availability")??"").trim(), warranty=String(formData.get("warranty")??"").trim();
 const pickup_available=formData.get("pickup_available")==="on", is_active=formData.get("is_active")==="on";
 if(brand.length>80||model.length>120||(skuRaw&&skuRaw.length>80)||category.length>80||description.length>5000||availability.length>80||warranty.length>500||slugInput.length>160) return {ok:false,error:"field_too_long"};
 if(!brand||!model||!category||!description||!priceRaw||!availability||!warranty) return {ok:false,error:"missing_fields"};
 let slugSource=slugInput; if(!slugSource&&mode==="create") slugSource=`${brand} ${model}`; if(!slugSource) return {ok:false,error:"missing_fields"};
 const slug=slugify(slugSource); if(!slug) return {ok:false,error:"invalid_slug"};
 const price=Number(priceRaw.replace(",",".")); if(!Number.isFinite(price)||price<0) return {ok:false,error:"invalid_price"};
 return {ok:true,data:{brand,model,slug,sku:skuRaw||null,category,description,price:Math.round(price*100)/100,availability,warranty,pickup_available,is_active}};
}
export function parseColorsInput(formData: FormData): ColorsParseResult {
 let list:unknown; try{list=JSON.parse(String(formData.get("colors_json")??"[]"));}catch{return {ok:false,error:"invalid_colors"}}
 if(!Array.isArray(list)) return {ok:false,error:"invalid_colors"}; const trimmed:string[]=[];
 for(const item of list){if(typeof item!=="string")return {ok:false,error:"invalid_colors"};const color=item.trim();if(color.length>80)return {ok:false,error:"field_too_long"};if(!color)return {ok:false,error:"empty_color"};trimmed.push(color)}
 if(new Set(trimmed).size!==trimmed.length)return {ok:false,error:"duplicate_color"}; return {ok:true,colors:trimmed};
}
export function parseSpecsInput(formData: FormData): SpecsParseResult {
 let list:unknown; try{list=JSON.parse(String(formData.get("specs_json")??"[]"));}catch{return {ok:false,error:"invalid_specs"}}
 if(!Array.isArray(list))return {ok:false,error:"invalid_specs"};const trimmed:SpecEntry[]=[];
 for(const item of list){if(typeof item!=="object"||item===null||typeof (item as {key?:unknown}).key!=="string"||typeof (item as {value?:unknown}).value!=="string")return {ok:false,error:"invalid_specs"};const key=(item as {key:string}).key.trim(),value=(item as {value:string}).value.trim();if(key.length>120||value.length>1000)return {ok:false,error:"field_too_long"};if(!key)return {ok:false,error:"empty_spec_key"};if(!value)return {ok:false,error:"empty_spec_value"};trimmed.push({key,value})}
 if(new Set(trimmed.map(s=>s.key)).size!==trimmed.length)return {ok:false,error:"duplicate_spec_key"};return {ok:true,specs:trimmed};
}
