"use server";
import {redirect} from "next/navigation";
import {createAdminClient} from "@/lib/supabase/admin";
import {parseNfeXml} from "@/lib/invoices/nfe";
import {parseNfePdf} from "@/lib/invoices/nfe-pdf";
import {logAdminAction,requireAdminSession} from "@/app/admin/products/actions";
const MAX_XML_BYTES=2*1024*1024;
const MAX_PDF_BYTES=10*1024*1024;

export async function importNfeFile(formData:FormData){
 const userId=await requireAdminSession();const file=formData.get("invoice");
 if(!(file instanceof File)||file.size===0)redirect("/admin/import/nfe?error=missing_file");
 const name=file.name.toLowerCase(),isXml=name.endsWith(".xml"),isPdf=name.endsWith(".pdf");
 if(!isXml&&!isPdf)redirect("/admin/import/nfe?error=invalid_file_type");
 if((isXml&&file.size>MAX_XML_BYTES)||(isPdf&&file.size>MAX_PDF_BYTES))redirect("/admin/import/nfe?error=file_too_large");
 let parsed;
 try{
   parsed=isXml
     ? parseNfeXml(await file.text())
     : parseNfePdf(new Uint8Array(await file.arrayBuffer()));
 }catch(error){
   const message=error instanceof Error?error.message:"";
   if(isPdf&&["pdf_text_not_found","pdf_items_not_found","pdf_missing_access_key","pdf_missing_cnpj","pdf_missing_issuer","pdf_missing_invoice_number"].includes(message)){
     redirect("/admin/import/nfe?error=pdf_unreadable");
   }
   redirect("/admin/import/nfe?error="+(isPdf?"invalid_pdf":"invalid_xml"));
 }
 const admin=createAdminClient();const {data:existing}=await admin.from("purchase_invoices").select("id").eq("access_key",parsed.accessKey).maybeSingle();
 if(existing?.id)redirect("/admin/import/nfe/"+existing.id+"?notice=already_imported");
 const {data:invoice,error:invoiceError}=await admin.from("purchase_invoices").insert({access_key:parsed.accessKey,invoice_number:parsed.invoiceNumber,series:parsed.series,issuer_cnpj:parsed.issuerCnpj,issuer_name:parsed.issuerName,issued_at:parsed.issuedAt,total_amount:parsed.totalAmount,item_count:parsed.items.length,xml_hash:parsed.xmlHash,created_by:userId}).select("id").single();
 if(invoiceError||!invoice)redirect("/admin/import/nfe?error=server_error");
 const {error:itemsError}=await admin.from("purchase_invoice_items").insert(parsed.items.map(item=>({invoice_id:invoice.id,line_number:item.lineNumber,supplier_code:item.supplierCode,ean:item.ean,description:item.description,ncm:item.ncm,cfop:item.cfop,unit:item.unit,quantity:item.quantity,unit_value:item.unitValue,total_value:item.totalValue})));
 if(itemsError){await admin.from("purchase_invoices").delete().eq("id",invoice.id);redirect("/admin/import/nfe?error=server_error")}
 await logAdminAction(userId,"purchase_invoice.import","purchase_invoice",invoice.id,{access_key:parsed.accessKey,invoice_number:parsed.invoiceNumber,issuer_cnpj:parsed.issuerCnpj,item_count:parsed.items.length,source_format:isPdf?"pdf":"xml"});
 redirect("/admin/import/nfe/"+invoice.id);
}

export async function applyInvoiceItem(invoiceId:string,itemId:string,formData:FormData){
 const userId=await requireAdminSession();const target=String(formData.get("target")??"").trim(),color=String(formData.get("color")??"").trim();
 if(!target)redirect("/admin/import/nfe/"+invoiceId+"?error=missing_target");
 let targetType="",targetId:string|null=null;
 if(target==="IGNORE"){targetType="IGNORE"}else{const [type,id]=target.split(":");if((type!=="STORE_VARIANT"&&type!=="MOTO_PRODUCT")||!id)redirect("/admin/import/nfe/"+invoiceId+"?error=invalid_target");targetType=type;targetId=id}
 const admin=createAdminClient();const {error}=await admin.rpc("apply_purchase_invoice_item",{p_item_id:itemId,p_target_type:targetType,p_target_id:targetId,p_target_color:targetType==="MOTO_PRODUCT"?color||null:null,p_actor_user_id:userId});
 if(error){const code=error.message.includes("non_integer_quantity")?"non_integer_quantity":"apply_failed";redirect("/admin/import/nfe/"+invoiceId+"?error="+code)}
 await logAdminAction(userId,"purchase_invoice.item_apply","purchase_invoice_item",itemId,{invoice_id:invoiceId,target_type:targetType,target_id:targetId,color:targetType==="MOTO_PRODUCT"?color||null:null});
 redirect("/admin/import/nfe/"+invoiceId);
}
