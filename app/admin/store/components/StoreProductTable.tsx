"use client";
import Link from "next/link";
import {useDeferredValue,useMemo,useState} from "react";
import {toggleStoreProduct} from "../actions";
import {matchesSearch} from "@/lib/cellshop/search";

type Money=number|string|null;
type Product={id:string;brand:string;name:string;sku?:string|null;price:Money;wholesale_price:Money;availability:string;is_active:boolean;wholesale_only?:boolean;retail_only?:boolean;category:string|null;store_product_variants?:{name:string}[]|null};
const brl=(v:Money)=>v===null||Number(v)===0?"—":Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export function StoreProductTable({products}:{products:Product[]}){
 const [query,setQuery]=useState("");
 const deferred=useDeferredValue(query);
 const shown=useMemo(()=>products.filter(p=>matchesSearch({brand:p.brand,name:p.name,sku:p.sku,store_product_variants:p.store_product_variants??[]},deferred,p.category??"")),[products,deferred]);
 const searching=deferred.trim().length>0;
 return <article className="panel admin-table-wrap">
  <div className="panel-title store-table-title"><h2>Produtos da loja</h2><span className="status-badge active">{searching?`${shown.length} de ${products.length}`:`${products.length} cadastrados`}</span></div>
  {products.length>0&&<div className="store-table-search" role="search">
   <label htmlFor="store-product-search" className="store-sr-only">Buscar produto</label>
   <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
   <input id="store-product-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por nome, marca, categoria ou referência (ex.: 6504)" autoComplete="off" enterKeyHint="search"/>
   {query&&<button type="button" onClick={()=>setQuery("")} aria-label="Limpar busca">✕</button>}
  </div>}
  {products.length?(shown.length?<table className="admin-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Varejo</th><th>Atacado</th><th>Disponibilidade</th><th>Status</th><th>Ações</th></tr></thead><tbody>{shown.map(product=><tr key={product.id}>
   <td><strong>{product.brand} {product.name}</strong>{product.wholesale_only&&<span className="status-badge store-badge-wholesale">Só atacado</span>}{product.retail_only&&<span className="status-badge store-badge-retail">Só varejo</span>}</td>
   <td>{product.category??"—"}</td>
   <td>{brl(product.price)}</td>
   <td>{brl(product.wholesale_price)}</td>
   <td>{product.availability}</td>
   <td><span className={`status-badge ${product.is_active?"active":""}`}>{product.is_active?"Ativo":"Inativo"}</span></td>
   <td><div className="table-actions"><Link href={`/admin/store/${product.id}/edit`}>Editar</Link><form action={toggleStoreProduct.bind(null,product.id,!product.is_active)}><button type="submit">{product.is_active?"Desativar":"Ativar"}</button></form></div></td>
  </tr>)}</tbody></table>:<p className="store-search-empty">Nenhum produto encontrado para “{deferred.trim()}”. Tente só o número da referência ou outra palavra.</p>):<div className="store-empty-state"><div className="store-empty-icon">▦</div><div><h3>Seu catálogo começa aqui</h3><p>Cadastre o primeiro produto da loja. Depois você poderá criar variantes, controlar estoque e acompanhar movimentações.</p></div><Link href="/admin/store/new" className="secondary-action">Cadastrar primeiro produto</Link></div>}
 </article>;
}
