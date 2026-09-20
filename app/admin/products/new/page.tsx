import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProduct, requireAdminSession } from "../actions";
import { PRODUCT_ERROR_MESSAGES } from "../types";
import { ProductForm } from "../ProductForm";
import { AdminShell } from "../../AdminShell";
import "../../admin.css";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdminSession();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect("/admin/login");

  const params = await searchParams;
  const errorMessage = params.error ? PRODUCT_ERROR_MESSAGES[params.error] : null;

  return (
    <AdminShell active="products" email={claims.claims.email}>
      <main className="admin-content admin-page">
        <div className="page-heading">
          <div><span>CATÁLOGO</span><h1>Nova moto</h1><p>Cadastre as informações comerciais e técnicas do modelo.</p></div>
          <div className="page-heading-actions"><Link className="secondary-action" href="/admin/import/nfe">Importar NF-e</Link><Link className="secondary-action" href="/admin/products">Voltar para motos</Link></div>
        </div>
        <section className="panel product-editor-panel">
          <ProductForm mode="create" action={createProduct} errorMessage={errorMessage} />
        </section>
      </main>
    </AdminShell>
  );
}
