import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { AdminShell } from "../AdminShell";
import { requireAdminSession } from "../products/actions";
import { setStorePriceMode } from "./actions";
import { InventoryAlerts } from "./components/InventoryAlerts";
import { InventoryMetrics } from "./components/InventoryMetrics";
import { StoreProductTable } from "./components/StoreProductTable";
import type { StoreAdminOverview } from "@/lib/store/admin-overview";
import "../admin.css";
import "./store.css";

export default async function StoreAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: categories }, { data: products }, { data: overviewRaw, error: overviewError }, { data: settings }] = await Promise.all([
    admin.from("store_categories").select("id,name,slug,is_active,sort_order").order("sort_order"),
    admin.from("store_products").select("id,category_id,brand,name,price,wholesale_price,availability,is_active,created_at").order("created_at",{ascending:false}).limit(500),
    admin.rpc("get_store_admin_overview",{p_alert_limit:4}),
    admin.from("catalog_settings").select("store_price_mode").eq("id", true).maybeSingle(),
  ]);

  if(overviewError) throw new Error("Não foi possível carregar o resumo operacional da loja.");
  const overview=overviewRaw as unknown as StoreAdminOverview;
  const categoryName=new Map((categories ?? []).map(c=>[c.id,c.name]));
  const priceMode=settings?.store_price_mode==="retail"?"retail":"wholesale";
  const { saved, error } = await searchParams;

  return <AdminShell active="store" email={typeof data.claims.email === "string" ? data.claims.email : undefined}>
    <section className="admin-content admin-page">
      <div className="page-heading"><div><span>REGTECH CELL SHOP</span><h1>Loja completa</h1><p>Celulares, tablets, carregadores, Bombox, Starlink e acessórios.</p></div>
        <div className="store-heading-actions">
          <Link href="/admin/store/fotos" className="secondary-action">Enviar fotos em lote</Link>
          <a href="/admin/store/export" className="secondary-action">Exportar planilha</a>
          <Link href="/admin/store/new" className="primary-action">+ Cadastrar produto</Link>
        </div>
      </div>

      {saved==="price_mode"&&<p className="admin-alert success" role="status">Preço exibido na loja online atualizado.</p>}
      {error&&<p className="admin-alert error" role="alert">Não foi possível salvar. Tente de novo.</p>}

      <InventoryMetrics metrics={overview.metrics} />

      <article className="panel store-price-mode">
        <div>
          <span>LOJA ONLINE</span>
          <h2>Preço exibido na loja online</h2>
          <p>Escolha qual preço o cliente vê no site. Produto sem esse preço aparece como “Consulte o valor”.</p>
        </div>
        <form action={setStorePriceMode} className="store-price-mode-form">
          <label className={priceMode==="wholesale"?"is-selected":""}>
            <input type="radio" name="store_price_mode" value="wholesale" defaultChecked={priceMode==="wholesale"} />
            <span><strong>Atacado</strong><small>Mostra o preço de atacado</small></span>
          </label>
          <label className={priceMode==="retail"?"is-selected":""}>
            <input type="radio" name="store_price_mode" value="retail" defaultChecked={priceMode==="retail"} />
            <span><strong>Varejo</strong><small>Mostra o preço de varejo</small></span>
          </label>
          <button type="submit" className="admin-primary-button">Salvar</button>
        </form>
      </article>

      <div className="store-category-grid">
        {(categories ?? []).filter(c=>c.is_active).map(category => <article className="panel store-category-card" key={category.id}>
          <div><small>ATIVA</small><h2>{category.name}</h2></div>
          <strong>{overview.category_counts[category.id] ?? 0}</strong><span>produtos</span>
        </article>)}
      </div>
      <InventoryAlerts alerts={overview.alerts} metrics={overview.metrics} />
      <StoreProductTable products={(products ?? []).map(p=>({...p,category:categoryName.get(p.category_id)??null}))} />
    </section>
  </AdminShell>;
}
