import { createStoreVariant, updateVariantStock } from "../actions";

type Variant = {
  id: string;
  name: string;
  sku: string | null;
  price: number | string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
};

export function VariantInventoryPanel({
  productId,
  variants,
}: {
  productId: string;
  variants: Variant[];
}) {
  return (
    <article className="panel product-editor-panel inventory-panel store-ops-panel">
      <div className="store-panel-heading">
        <div>
          <span>ESTOQUE E VARIAÇÕES</span>
          <h2>Variantes e estoque</h2>
          <p>Use variantes para capacidade, cor, tamanho ou outra configuração comercial do produto.</p>
        </div>
        <span className="status-badge active">{variants.length} variantes</span>
      </div>

      <form action={createStoreVariant.bind(null, productId)} className="variant-create-form polished-variant-form">
        <label>
          <span>Variante *</span>
          <input name="variant_name" required maxLength={120} placeholder="Ex: 128 GB · Preto" className="admin-control" />
        </label>
        <label>
          <span>SKU</span>
          <input name="variant_sku" maxLength={100} placeholder="SKU da variante" className="admin-control" />
        </label>
        <label>
          <span>Preço</span>
          <input name="variant_price" type="number" min="0" step=".01" placeholder="Opcional" className="admin-control" />
        </label>
        <label>
          <span>Estoque inicial</span>
          <input name="stock_quantity" type="number" min="0" step="1" defaultValue="0" className="admin-control" />
        </label>
        <label>
          <span>Alerta baixo</span>
          <input name="low_stock_threshold" type="number" min="0" step="1" defaultValue="2" className="admin-control" />
        </label>
        <button className="admin-primary-button" type="submit">Adicionar variante</button>
      </form>

      {variants.length ? (
        <div className="variant-list polished-variant-list">
          {variants.map((variant) => {
            const lowStock = variant.stock_quantity <= variant.low_stock_threshold;
            const priceLabel = variant.price !== null
              ? " · " + Number(variant.price).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              : "";
            return (
              <div className="variant-row polished-variant-row" key={variant.id}>
                <div className="variant-meta">
                  <strong>{variant.name}</strong>
                  <small>{variant.sku || "Sem SKU"}{priceLabel}</small>
                </div>

                <span className={"stock-pill " + (lowStock ? "low" : "")}>
                  {variant.stock_quantity} un.
                </span>

                <form action={updateVariantStock.bind(null, productId, variant.id)} className="variant-stock-form">
                  <input
                    name="stock_quantity"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={variant.stock_quantity}
                    aria-label={"Novo estoque de " + variant.name}
                    className="admin-control"
                  />
                  <input
                    name="note"
                    maxLength={200}
                    placeholder="Motivo do ajuste (opcional)"
                    aria-label={"Motivo do ajuste de " + variant.name}
                    className="admin-control"
                  />
                  <button className="admin-secondary-button" type="submit">Atualizar estoque</button>
                </form>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="store-inline-empty">
          <strong>Nenhuma variante cadastrada</strong>
          <span>Crie a primeira configuração do produto para começar o controle de estoque.</span>
        </div>
      )}
    </article>
  );
}
