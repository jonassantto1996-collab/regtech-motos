type Variant={product_id:string;stock_quantity:number;low_stock_threshold:number;is_active:boolean};
type Product={id:string};
export function InventoryMetrics({products,variants}:{products:Product[];variants:Variant[]}){
 const active=variants.filter(v=>v.is_active);
 const totalStock=active.reduce((sum,v)=>sum+v.stock_quantity,0);
 const lowStock=active.filter(v=>v.stock_quantity>0&&v.stock_quantity<=v.low_stock_threshold).length;
 const outOfStock=active.filter(v=>v.stock_quantity===0).length;
 const withoutVariants=products.filter(p=>!active.some(v=>v.product_id===p.id)).length;
 return <div className="store-inventory-metrics">
  <article><span>Estoque total</span><strong>{totalStock}</strong><small>unidades nas variantes</small></article>
  <article><span>Estoque baixo</span><strong>{lowStock}</strong><small>variantes no limite</small></article>
  <article><span>Sem estoque</span><strong>{outOfStock}</strong><small>variantes zeradas</small></article>
  <article><span>Sem variantes</span><strong>{withoutVariants}</strong><small>produtos a configurar</small></article>
 </div>;
}
