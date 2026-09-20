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