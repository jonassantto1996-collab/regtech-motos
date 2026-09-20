import type {StoreOverviewMetrics} from "@/lib/store/admin-overview";

export function InventoryMetrics({metrics}:{metrics:StoreOverviewMetrics}){
 return <div className="store-inventory-metrics">
  <article><span>Estoque total</span><strong>{metrics.total_stock}</strong><small>unidades nas variantes</small></article>
  <article><span>Estoque baixo</span><strong>{metrics.low_stock}</strong><small>variantes no limite</small></article>
  <article><span>Sem estoque</span><strong>{metrics.out_of_stock}</strong><small>variantes zeradas</small></article>
  <article><span>Sem variantes</span><strong>{metrics.products_without_variants}</strong><small>produtos a configurar</small></article>
 </div>;
}
