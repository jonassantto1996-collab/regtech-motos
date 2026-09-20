import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../AdminShell";
import "../admin.css";

export default async function StoreAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    admin.from("store_categories").select("id,name,slug,is_active,sort_order").order("sort_order"),
    admin.from("store_products").select("id,category_id,brand,name,price,availability,is_active,created_at").order("created_at",{ascending:false}).limit(100),
  ]);

  const counts = new Map<string,number>();
  for (const product of products ?? []) counts.set(product.category_id,(counts.get(product.category_id) ?? 0)+1);

  return <AdminShell active="store" email={data.claims.email}>
    <section className="admin-content admin-page">
      <div className="page-heading"><div><span>CATÁLOGO GERAL</span><h1>Loja completa</h1><p>Estrutura separada das motos para celulares, áudio, TVs, Starlink e outros produtos.</p></div></div>
      <div className="store-category-grid">
        {(categories ?? []).map(category => <article className="panel store-category-card" key={category.id}>
          <div><small>{category.is_active ? "ATIVA" : "INATIVA"}</small><h2>{category.name}</h2></div>
          <strong>{counts.get(category.id) ?? 0}</strong><span>produtos</span>
        </article>)}
      </div>
      <article className="panel store-foundation">
        <div className="panel-title"><h2>Catálogo da loja</h2><span className="status-badge active">Base criada</span></div>
        <p>A base de dados já está preparada para receber os produtos gerais sem misturar especificações técnicas das motos.</p>
        <div className="store-roadmap"><span>1. Categorias ✓</span><span>2. Produtos ✓</span><span>3. Cadastro e edição — próximo</span><span>4. Imagens e estoque — depois</span></div>
      </article>
    </section>
  </AdminShell>;
}
