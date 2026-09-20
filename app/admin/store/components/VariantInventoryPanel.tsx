import {createStoreVariant,updateVariantStock} from "../actions";

type Variant={id:string;name:string;sku:string|null;price:number|string|null;stock_quantity:number;low_stock_threshold:number;is_active:boolean};
export function VariantInventoryPanel({productId,variants}:{productId:string;variants:Variant[]}){
 return <article className="panel product-editor-panel inventory-panel">
  <div className="panel-title"><h2>Variantes e estoque</h2><span className="status-badge active">{variants.length} variantes</span></div>
  <p className="form-muted">Use variantes para capacidade, cor, tamanho ou outra configuração comercial do produto.</p>
  <form action={createStoreVariant.bind(null,productId)} className="variant-create-form">
   <input name="variant_name" required maxLength={120} placeholder="Ex: 128 GB · Preto" className="admin-control"/>
   <input name="variant_sku" maxLength={100} placeholder="SKU da variante" className="admin-control"/>
   <input name="variant_price" type="number" min="0" step=".01" placeholder="Preço opcional" className="admin-control"/>
   <input name="stock_quantity" type="number" min="0" step="1" defaultValue="0" aria-label="Estoque inicial" className="admin-control"/>
   <input name="low_stock_threshold" type="number" min="0" step="1" defaultValue="2" aria-label="Alerta de estoque" className="admin-control"/>
   <button className="admin-primary-button">Adicionar variante</button>
  </form>
  <div className="variant-list">{variants.map(v=><div className="variant-row" key={v.id}>
   <div><strong>{v.name}</strong><small>{v.sku||"Sem SKU"}{v.price!==null?` · ${Number(v.price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}`:""}</small></div>
   <span className={`stock-pill ${v.stock_quantity<=v.low_stock_threshold?"low":""}`}>{v.stock_quantity} un.</span>
   <form action={updateVariantStock.bind(null,productId,v.id)}><input name="stock_quantity" type="number" min="0" step="1" defaultValue={v.stock_quantity} className="admin-control"/><input name="note" maxLength={200} placeholder="Motivo do ajuste (opcional)" className="admin-control"/><button className="admin-secondary-button">Atualizar</button></form>
  </div>)}</div>
 </article>;
}
