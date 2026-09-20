"use server";
import {redirect} from "next/navigation";
import {createAdminClient} from "@/lib/supabase/admin";
import {requireAdminSession,logAdminAction} from "@/app/admin/products/actions";
import {parseStoreProductForm} from "@/lib/store/validation";
function err(e:{code?:string}|null){return e?.code==="23505"?"duplicate":"server_error"}
export async function createStoreProduct(formData:FormData){
 const user=await requireAdminSession();const parsed=parseStoreProductForm(formData,"create");if(!parsed.ok)redirect("/admin/store/new?error="+parsed.error);
 const admin=createAdminClient();const {data,error}=await admin.from("store_products").insert(parsed.data).select("id").single();if(error)redirect("/admin/store/new?error="+err(error));
 await logAdminAction(user,"store_product.create","store_product",data.id,{slug:parsed.data.slug});redirect("/admin/store");
}
export async function updateStoreProduct(id:string,formData:FormData){
 const user=await requireAdminSession();const parsed=parseStoreProductForm(formData,"edit");if(!parsed.ok)redirect("/admin/store/"+id+"/edit?error="+parsed.error);
 const admin=createAdminClient();const {data,error}=await admin.from("store_products").update(parsed.data).eq("id",id).select("id").maybeSingle();if(error||!data)redirect("/admin/store/"+id+"/edit?error="+(error?err(error):"not_found"));
 await logAdminAction(user,"store_product.update","store_product",id,{slug:parsed.data.slug});redirect("/admin/store");
}
export async function toggleStoreProduct(id:string,next:boolean){const user=await requireAdminSession();const admin=createAdminClient();const {error}=await admin.from("store_products").update({is_active:next}).eq("id",id);if(error)redirect("/admin/store?error=server_error");await logAdminAction(user,next?"store_product.activate":"store_product.deactivate","store_product",id);redirect("/admin/store");}
export async function createStoreVariant(productId:string,formData:FormData){
 const user=await requireAdminSession();const name=String(formData.get("variant_name")??"").trim(),sku=String(formData.get("variant_sku")??"").trim(),priceRaw=String(formData.get("variant_price")??"").trim(),stockRaw=String(formData.get("stock_quantity")??"0").trim(),thresholdRaw=String(formData.get("low_stock_threshold")??"2").trim();
 if(!name||name.length>120||sku.length>100)redirect("/admin/store/"+productId+"/edit?error=invalid_variant");
 const stock=Number(stockRaw),threshold=Number(thresholdRaw),price=priceRaw?Number(priceRaw.replace(",",".")):null;
 if(!Number.isInteger(stock)||stock<0||!Number.isInteger(threshold)||threshold<0||(price!==null&&(!Number.isFinite(price)||price<0)))redirect("/admin/store/"+productId+"/edit?error=invalid_variant");
 const admin=createAdminClient();const {data,error}=await admin.from("store_product_variants").insert({product_id:productId,name,sku:sku||null,price,stock_quantity:stock,low_stock_threshold:threshold}).select("id").single();
 if(error)redirect("/admin/store/"+productId+"/edit?error="+err(error));await logAdminAction(user,"store_variant.create","store_product_variant",data.id,{product_id:productId,stock_quantity:stock});redirect("/admin/store/"+productId+"/edit");
}
export async function updateVariantStock(productId:string,variantId:string,formData:FormData){
 const user=await requireAdminSession();const stock=Number(String(formData.get("stock_quantity")??""));if(!Number.isInteger(stock)||stock<0)redirect("/admin/store/"+productId+"/edit?error=invalid_stock");
 const admin=createAdminClient();const {error}=await admin.from("store_product_variants").update({stock_quantity:stock}).eq("id",variantId).eq("product_id",productId);if(error)redirect("/admin/store/"+productId+"/edit?error=server_error");
 await logAdminAction(user,"store_variant.stock_update","store_product_variant",variantId,{product_id:productId,stock_quantity:stock});redirect("/admin/store/"+productId+"/edit");
}