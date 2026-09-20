"use server";
import {redirect} from "next/navigation";
import {createAdminClient} from "@/lib/supabase/admin";
import {requireAdminSession,logAdminAction} from "@/app/admin/products/actions";
import {parseStoreProductForm,parseStoreVariantForm,parseStockQuantity} from "@/lib/store/validation";
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
 const user=await requireAdminSession();const parsed=parseStoreVariantForm(formData);if(!parsed.ok)redirect("/admin/store/"+productId+"/edit?error="+parsed.error);
 const admin=createAdminClient();const {data,error}=await admin.from("store_product_variants").insert({product_id:productId,...parsed.data}).select("id").single();
 if(error)redirect("/admin/store/"+productId+"/edit?error="+err(error));await logAdminAction(user,"store_variant.create","store_product_variant",data.id,{product_id:productId,stock_quantity:parsed.data.stock_quantity});redirect("/admin/store/"+productId+"/edit");
}
export async function updateVariantStock(productId:string,variantId:string,formData:FormData){
 const user=await requireAdminSession();const parsed=parseStockQuantity(formData);if(!parsed.ok)redirect("/admin/store/"+productId+"/edit?error="+parsed.error);const stock=parsed.stock;
 const note=String(formData.get("note")??"").trim();if(note.length>200)redirect("/admin/store/"+productId+"/edit?error=note_too_long");
 const admin=createAdminClient();const {data,error}=await admin.rpc("adjust_store_variant_stock",{p_product_id:productId,p_variant_id:variantId,p_new_quantity:stock,p_actor_user_id:user,p_note:note||null});
 if(error)redirect("/admin/store/"+productId+"/edit?error=server_error");
 const movement=Array.isArray(data)?data[0]:null;
 await logAdminAction(user,"store_variant.stock_update","store_product_variant",variantId,{product_id:productId,previous_quantity:movement?.previous_quantity,current_quantity:stock,movement_id:movement?.movement_id??null});
 redirect("/admin/store/"+productId+"/edit");
}
