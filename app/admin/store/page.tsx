import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { AdminShell } from "../AdminShell";
import { toggleStoreProduct } from "./actions";
import { requireAdminSession } from "../products/actions";
import "../admin.css";

export default async function StoreAdminPage() {
  const user = await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: categories }, { data: products }, { data: variants }] = await Promise.all([
    admin.from("store_categories").select("id,name,slug,is_active,sort_order").order("sort_order"),
    admin.from("store_products").select("id,category_id,brand,name,price,availability,is_active,created_at").order("created_at",{ascending:false}).limit(100),
    admin.from("store_product_variants").select("id,product_id,name,sku,stock_quantity,low_stock_threshold,is_active"),
  ]);

  const counts = new Map<string,number>();
  for (const product of products ?? []) counts.set(product.category_id,(counts.get(product.category_id) ?? 0)+1);

  const activeVariants=(variants??[]).filter(v=>v.is_active); const totalStock=activeVariants.reduce((sum,v)=>sum+v.stock_quantity,0); const lowStock=activeVariants.filter(v=>v.stock_quantity>0&&v.stock_quantity<=v.low_stock_threshold); const outOfStock=activeVariants.filter(v=>v.stock_quantity===0); const productsWithoutVariants=(products??[]).filter(p=>!activeVariants.some(v=>v.product_id===p.id)).length;

  return <AdminShell active="store" email={typeof data.claims.email === "string" ? data.claims.email : undefined}>
    <section className="admin-content admin-page">
      <div className="page-heading"><div><span>CATÁLOGO GERAL</span><h1>Loja completa</h1><p>Estrutura separada das motos para celulares, áudio, TVs, Starlink e outros produtos.</p></div><Link href="/admin/store/new" className="primary-action">+ Cadastrar produto</Link></div>
      <div className="store-inventory-metrics"><article><span>Estoque total</span><strong>{totalStock}</strong><small>unidades nas variantes</small></article><article><span>Estoque baixo</span><strong>{lowStock.length}</strong><small>variantes no limite</small></article><article><span>Sem estoque</span><strong>{outOfStock.length}</strong><small>variantes zeradas</small></article><article><span>Sem variantes</span><strong>{productsWithoutVariants}</strong><small>produtos a configurar</small></article></div>
      <div className="store-category-grid">
        {(categories ?? []).map(category => <article className="panel store-category-card" key={category.id}>
          <div><small>{category.is_active ? "ATIVA" : "INATIVA"}</small><h2>{category.name}</h2></div>
          <strong>{counts.get(category.id) ?? 0}</strong><span>produtos</span>
        </article>)}
      </div>
      <article className="panel admin-table-wrap"><div className="panel-title store-table-title"><h2>Produtos da loja</h2><span className="status-badge active">{products?.length ?? 0} cadastrados</span></div>{products?.length ? <table className="admin-table"><thead><tr><th>Produto</th><th>Preço</th><th>Disponibilidade</th><th>Status</th><th>Ações</th></tr></thead><tbody>{products.map(product=><tr key={product.id}><td><strong>{product.brand} {product.name}</strong></td><td>{Number(product.price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td><td>{product.availability}</td><td><span className={`status-badge ${product.is_active?"active":""}`}>{product.is_active?"Ativo":"Inativo"}</span></td><td><div className="table-actions"><Link href={`/admin/store/${product.id}/edit`}>Editar</Link><form action={toggleStoreProduct.bind(null,product.id,!product.is_active)}><button type="submit">{product.is_active?"Desativar":"Ativar"}</button></form></div></td></tr>)}</tbody></table>:<div className="empty-state">Nenhum produto cadastrado ainda.</div>}</article>
    </section>
  </AdminShell>;
}
