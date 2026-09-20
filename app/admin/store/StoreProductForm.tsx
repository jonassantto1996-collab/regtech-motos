import Link from "next/link";

type Category={id:string;name:string};
type Product={category_id:string;brand:string;name:string;slug:string;sku:string|null;description:string;price:number;availability:string;is_active:boolean};

export function StoreProductForm({action,categories,product,errorMessage,mode}:{action:(data:FormData)=>void;categories:Category[];product?:Product;errorMessage?:string|null;mode:"create"|"edit"}){
 return <form action={action} className="product-form store-product-form">
  <div className="store-form-heading">
   <div><span>DADOS DO PRODUTO</span><h2>Informações do produto</h2><p>Organize os dados comerciais e de catálogo deste item.</p></div>
   <span className="store-form-required">* Campos obrigatórios</span>
  </div>

  <div className="store-form-grid">
   <label className="admin-field">Categoria *<select name="category_id" required defaultValue={product?.category_id??""} className="admin-control store-select"><option value="" disabled>Selecione</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
   <label className="admin-field">Marca *<input name="brand" required maxLength={80} defaultValue={product?.brand} className="admin-control" placeholder="Ex: Samsung"/></label>
   <label className="admin-field">Nome / modelo *<input name="name" required maxLength={160} defaultValue={product?.name} className="admin-control" placeholder="Ex: Galaxy A55 5G"/></label>
   <label className="admin-field">SKU<input name="sku" maxLength={100} defaultValue={product?.sku??""} className="admin-control" placeholder="Ex: A55-128-PRETO"/></label>
   <label className="admin-field store-field-wide">Slug<input name="slug" maxLength={180} defaultValue={product?.slug} className="admin-control" placeholder={mode==="create"?"Gerado automaticamente se vazio":undefined}/><small className="field-hint">{mode==="create"?"Pode deixar vazio para gerar automaticamente.":"Mantenha para não alterar a URL."}</small></label>
   <label className="admin-field store-field-wide">Descrição<textarea name="description" maxLength={5000} rows={5} defaultValue={product?.description} className="admin-control admin-textarea" placeholder="Descrição comercial do produto, diferenciais e informações úteis."/></label>
   <label className="admin-field">Preço (R$) *<input name="price" type="number" step=".01" min="0" required defaultValue={product?.price} className="admin-control" placeholder="0,00"/></label>
   <label className="admin-field">Disponibilidade *<input name="availability" required maxLength={80} defaultValue={product?.availability??"Disponível"} className="admin-control"/></label>
  </div>

  <div className="store-form-status">
   <label className="store-toggle-row">
    <input type="checkbox" name="is_active" defaultChecked={product?.is_active??true}/>
    <span className="store-toggle" aria-hidden="true"></span>
    <span><strong>Produto ativo</strong><small>Quando ativo, o item pode aparecer no catálogo público.</small></span>
   </label>
  </div>

  {errorMessage&&<p className="admin-alert error">{errorMessage}</p>}

  <div className="store-form-actions">
   <Link href="/admin/store" className="secondary-action">Cancelar</Link>
   <button className="admin-primary-button" type="submit">{mode==="create"?"Cadastrar produto":"Salvar alterações"}</button>
  </div>
 </form>
}
