import Link from "next/link";

type Product={id:string;brand:string;name:string};
type Variant={id:string;product_id:string;name:string;sku:string|null;stock_quantity:number;low_stock_threshold:number};

export function InventoryAlerts({products,activeVariants}:{products:Product[];activeVariants:Variant[]}){
 const outOfStock=activeVariants.filter(v=>v.stock_quantity===0);
 const lowStock=activeVariants.filter(v=>v.stock_quantity>0&&v.stock_quantity<=v.low_stock_threshold);
 const withoutVariants=products.filter(p=>!activeVariants.some(v=>v.product_id===p.id));
 const pending=outOfStock.length+lowStock.length+withoutVariants.length;
 if(!pending)return null;
 const productName=(id:string)=>{const p=products.find(item=>item.id===id);return p?`${p.brand} ${p.name}`:"Produto"};
 return <article className="panel store-attention"><div className="panel-title"><h2>Atenção de estoque</h2><span className="status-badge">{pending} pendências</span></div><div className="store-attention-list">
  {outOfStock.slice(0,4).map(v=><Link key={v.id} href={`/admin/store/${v.product_id}/edit`}><div><strong>{productName(v.product_id)} · {v.name}</strong><small>{v.sku||"Sem SKU"} · Sem estoque</small></div><span className="stock-pill low">0 un.</span></Link>)}
  {lowStock.slice(0,4).map(v=><Link key={v.id} href={`/admin/store/${v.product_id}/edit`}><div><strong>{productName(v.product_id)} · {v.name}</strong><small>{v.sku||"Sem SKU"} · Estoque baixo</small></div><span className="stock-pill low">{v.stock_quantity} un.</span></Link>)}
  {withoutVariants.slice(0,4).map(p=><Link key={p.id} href={`/admin/store/${p.id}/edit`}><div><strong>{p.brand} {p.name}</strong><small>Sem variante/estoque configurado</small></div><span className="status-badge">Configurar</span></Link>)}
 </div></article>;
}
