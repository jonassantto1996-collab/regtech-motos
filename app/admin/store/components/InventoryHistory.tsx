type Variant={id:string;name:string;sku:string|null};
type Movement={id:string;variant_id:string;movement_type:string;quantity_before:number;quantity_after:number;delta:number;note:string|null;created_at:string};

const dateFormatter=new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short",timeZone:"America/Belem"});

export function InventoryHistory({variants,movements}:{variants:Variant[];movements:Movement[]}){
 const variantName=(id:string)=>{const v=variants.find(item=>item.id===id);return v?v.name:"Variante"};
 return <article className="panel product-editor-panel inventory-history-panel">
  <div className="panel-title"><h2>Histórico de estoque</h2><span className="status-badge active">{movements.length} movimentações</span></div>
  <p className="form-muted">Últimas alterações registradas para este produto.</p>
  {movements.length?<div className="inventory-history-list">{movements.map(m=><div className="inventory-history-row" key={m.id}>
   <div><strong>{variantName(m.variant_id)}</strong><small>{dateFormatter.format(new Date(m.created_at))}{m.note?` · ${m.note}`:""}</small></div>
   <span className={`inventory-delta ${m.delta<0?"negative":m.delta>0?"positive":""}`}>{m.delta>0?"+":""}{m.delta}</span>
   <small className="inventory-change">{m.quantity_before} → {m.quantity_after}</small>
  </div>)}</div>:<div className="empty-state">Nenhuma movimentação registrada ainda.</div>}
 </article>;
}
