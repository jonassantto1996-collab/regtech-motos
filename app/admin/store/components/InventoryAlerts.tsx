import Link from "next/link";
import type {StoreAdminOverview} from "@/lib/store/admin-overview";

export function InventoryAlerts({alerts,metrics}:{alerts:StoreAdminOverview["alerts"];metrics:StoreAdminOverview["metrics"]}){
 const pending=metrics.out_of_stock+metrics.low_stock+metrics.products_without_variants;
 if(!pending)return null;
 return <article className="panel store-attention"><div className="panel-title"><h2>Atenção de estoque</h2><span className="status-badge">{pending} pendências</span></div><div className="store-attention-list">
  {alerts.out_of_stock.map(v=><Link key={v.id} href={`/admin/store/${v.product_id}/edit`}><div><strong>{v.brand} {v.product_name} · {v.name}</strong><small>{v.sku||"Sem SKU"} · Sem estoque</small></div><span className="stock-pill low">0 un.</span></Link>)}
  {alerts.low_stock.map(v=><Link key={v.id} href={`/admin/store/${v.product_id}/edit`}><div><strong>{v.brand} {v.product_name} · {v.name}</strong><small>{v.sku||"Sem SKU"} · Estoque baixo</small></div><span className="stock-pill low">{v.stock_quantity} un.</span></Link>)}
  {alerts.without_variants.map(p=><Link key={p.id} href={`/admin/store/${p.id}/edit`}><div><strong>{p.brand} {p.name}</strong><small>Sem variante/estoque configurado</small></div><span className="status-badge">Configurar</span></Link>)}
 </div></article>;
}
