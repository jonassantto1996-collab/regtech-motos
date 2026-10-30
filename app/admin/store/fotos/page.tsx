import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../../AdminShell";
import { requireAdminSession } from "../../products/actions";
import { BatchPhotoUploader } from "../components/BatchPhotoUploader";
import "../../admin.css";
import "../store.css";

export const dynamic = "force-dynamic";

export default async function StoreBatchPhotosPage() {
  await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: products } = await admin
    .from("store_products")
    .select("id,slug,brand,name,is_active,store_product_images(count)")
    .order("brand")
    .order("name")
    .limit(500);

  const list = (products ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    label: `${p.brand} ${p.name}`,
    isActive: p.is_active,
    imageCount: (p.store_product_images as unknown as { count: number }[] | null)?.[0]?.count ?? 0,
  }));

  return (
    <AdminShell active="store" email={typeof data.claims.email === "string" ? data.claims.email : undefined}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>REGTECH CELL SHOP</span>
            <h1>Enviar fotos em lote</h1>
            <p>Selecione a pasta com as fotos: cada uma vai para o produto certo pelo nome do arquivo.</p>
          </div>
          <Link href="/admin/store" className="secondary-action">← Voltar para a loja</Link>
        </div>
        <BatchPhotoUploader products={list} />
      </section>
    </AdminShell>
  );
}
