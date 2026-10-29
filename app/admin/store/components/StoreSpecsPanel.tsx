import { addStoreProductSpec, deleteStoreProductSpec } from "../media-actions";

export type StoreSpec = { id: string; spec_key: string; spec_value: string };

export function StoreSpecsPanel({ productId, specs }: { productId: string; specs: StoreSpec[] }) {
  return (
    <article className="panel product-editor-panel store-ops-panel" id="ficha">
      <div className="store-panel-heading">
        <div>
          <span>FICHA TÉCNICA</span>
          <h2>Ficha técnica</h2>
          <p>Informações que aparecem em lista na página do produto, como tela, bateria, câmera e o que vem na caixa.</p>
        </div>
        <span className="status-badge active">{specs.length} itens</span>
      </div>

      <form action={addStoreProductSpec.bind(null, productId)} className="store-spec-form">
        <label>
          <span>Item *</span>
          <input name="spec_key" required maxLength={80} placeholder="Ex: Bateria" className="admin-control" />
        </label>
        <label>
          <span>Informação *</span>
          <input name="spec_value" required maxLength={200} placeholder="Ex: 5000 mAh" className="admin-control" />
        </label>
        <button className="admin-primary-button" type="submit">Adicionar</button>
      </form>

      {specs.length ? (
        <dl className="store-spec-list">
          {specs.map((spec) => (
            <div className="store-spec-row" key={spec.id}>
              <dt>{spec.spec_key}</dt>
              <dd>{spec.spec_value}</dd>
              <form action={deleteStoreProductSpec.bind(null, spec.id, productId)}>
                <button type="submit" className="product-image-remove-button" aria-label={"Remover " + spec.spec_key}>Remover</button>
              </form>
            </div>
          ))}
        </dl>
      ) : (
        <div className="store-inline-empty">
          <strong>Ficha técnica vazia</strong>
          <span>Adicione as principais especificações do produto.</span>
        </div>
      )}
    </article>
  );
}
