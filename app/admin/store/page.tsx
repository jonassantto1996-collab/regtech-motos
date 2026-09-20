import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { AdminShell } from "../AdminShell";
import { requireAdminSession } from "../products/actions";
import { InventoryAlerts } from "./components/InventoryAlerts";
import { InventoryMetrics } from "./components/InventoryMetrics";
import { StoreProductTable } from "./components/StoreProductTable";
import type { StoreAdminOverview } from "@/lib/store/admin-overview";
import "../admin.css";

export default async function StoreAdminPage() {
  await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: categories }, { data: products }, { data: overviewRaw, error: overviewError }] = await Promise.all([
    admin.from("store_categories").select("id,name,slug,is_active,sort_order").order("sort_order"),
    admin.from("store_products").select("id,category_id,brand,name,price,availability,is_active,created_at").order("created_at",{ascending:false}).limit(100),
    admin.rpc("get_store_admin_overview",{p_alert_limit:4}),
  ]);

  if(overviewError) throw new Error("Não foi possível carregar o resumo operacional da loja.");
  const overview=overviewRaw as unknown as StoreAdminOverview;

  return <AdminShell active="store" email={typeof data.claims.email === "string" ? data.claims.email : undefined}>
    <section className="admin-content admin-page">
      <div className="page-heading"><div><span>CATÁLOGO GERAL</span><h1>Loja completa</h1><p>Estrutura separada das motos para celulares, áudio, TVs, Starlink e outros produtos.</p></div><Link href="/admin/store/new" className="primary-action">+ Cadastrar produto</Link></div>
      <InventoryMetrics metrics={overview.metrics} />
      <div className="store-category-grid">
        {(categories ?? []).map(category => <article className="panel store-category-card" key={category.id}>
          <div><small>{category.is_active ? "ATIVA" : "INATIVA"}</small><h2>{category.name}</h2></div>
          <strong>{overview.category_counts[category.id] ?? 0}</strong><span>produtos</span>
        </article>)}
      </div>
      <InventoryAlerts alerts={overview.alerts} metrics={overview.metrics} />
      <StoreProductTable products={products ?? []} />
    </section>
  </AdminShell>;
}
