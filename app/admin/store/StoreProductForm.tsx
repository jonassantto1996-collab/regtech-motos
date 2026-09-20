type Category={id:string;name:string};type Product={category_id:string;brand:string;name:string;slug:string;sku:string|null;description:string;price:number;availability:string;is_active:boolean};
export function StoreProductForm({action,categories,product,errorMessage,mode}:{action:(data:FormData)=>void;categories:Category[];product?:Product;errorMessage?:string|null;mode:"create"|"edit"}){
 return <form action={action} className="product-form"><h2 className="form-section-title">Informações do produto</h2>
 <label className="admin-field">Categoria *<select name="category_id" required defaultValue={product?.category_id??""} className="admin-control"><option value="" disabled>Selecione</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
 <label className="admin-field">Marca *<input name="brand" required maxLength={80} defaultValue={product?.brand} className="admin-control"/></label>
 <label className="admin-field">Nome / modelo *<input name="name" required maxLength={160} defaultValue={product?.name} className="admin-control"/></label>
 <label className="admin-field">Slug<input name="slug" maxLength={180} defaultValue={product?.slug} className="admin-control"/><small className="field-hint">{mode==="create"?"Pode deixar vazio para gerar automaticamente.":"Mantenha para não alterar a URL."}</small></label>
 <label className="admin-field">SKU<input name="sku" maxLength={100} defaultValue={product?.sku??""} className="admin-control"/></label>
 <label className="admin-field">Descrição<textarea name="description" maxLength={5000} rows={5} defaultValue={product?.description} className="admin-control admin-textarea"/></label>
 <label className="admin-field">Preço (R$) *<input name="price" type="number" step=".01" min="0" required defaultValue={product?.price} className="admin-control"/></label>
 <label className="admin-field">Disponibilidade *<input name="availability" required maxLength={80} defaultValue={product?.availability??"Disponível"} className="admin-control"/></label>
 <label className="form-check"><input type="checkbox" name="is_active" defaultChecked={product?.is_active??true}/> Produto ativo</label>
 {errorMessage&&<p className="admin-alert error">{errorMessage}</p>}<button className="admin-primary-button" type="submit">{mode==="create"?"Cadastrar produto":"Salvar alterações"}</button></form>
}