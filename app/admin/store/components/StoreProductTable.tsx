import Link from "next/link";
import {toggleStoreProduct} from "../actions";

type Product={id:string;brand:string;name:string;price:number|string;availability:string;is_active:boolean};
export function StoreProductTable({products}:{products:Product[]}){
 return <article className="panel admin-table-wrap">
  <div className="panel-title store-table-title"><h2>Produtos da loja</h2><span className="status-badge active">{products.length} cadastrados</span></div>
  {products.length?<table className="admin-table"><thead><tr><th>Produto</th><th>Preço</th><th>Disponibilidade</th><th>Status</th><th>Ações</th></tr></thead><tbody>{products.map(product=><tr key={product.id}>
   <td><strong>{product.brand} {product.name}</strong></td>
   <td>{Number(product.price).toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</td>
   <td>{product.availability}</td>
   <td><span className={`status-badge ${product.is_active?"active":""}`}>{product.is_active?"Ativo":"Inativo"}</span></td>
   <td><div className="table-actions"><Link href={`/admin/store/${product.id}/edit`}>Editar</Link><form action={toggleStoreProduct.bind(null,product.id,!product.is_active)}><button type="submit">{product.is_active?"Desativar":"Ativar"}</button></form></div></td>
  </tr>)}</tbody></table>:<div className="empty-state">Nenhum produto cadastrado ainda.</div>}
 </article>;
}
