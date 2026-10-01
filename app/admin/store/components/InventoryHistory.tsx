type Variant = { id: string; name: string; sku: string | null };
type Movement = {
  id: string;
  variant_id: string;
  movement_type: string;
  quantity_before: number;
  quantity_after: number;
  delta: number;
  note: string | null;
  created_at: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Belem",
});

export function InventoryHistory({
  variants,
  movements,
}: {
  variants: Variant[];
  movements: Movement[];
}) {
  const variantNames = new Map(variants.map((variant) => [variant.id, variant.name]));

  return (
    <article className="panel product-editor-panel inventory-history-panel store-ops-panel">
      <div className="store-panel-heading">
        <div>
          <span>RASTREABILIDADE</span>
          <h2>Histórico de estoque</h2>
          <p>Últimas alterações registradas para este produto.</p>
        </div>
        <span className="status-badge active">{movements.length} movimentações</span>
      </div>

      {movements.length ? (
        <div className="inventory-history-list polished-history-list">
          {movements.map((movement) => (
            <div className="inventory-history-row polished-history-row" key={movement.id}>
              <div>
                <strong>{variantNames.get(movement.variant_id) ?? "Variante"}</strong>
                <small>
                  {dateFormatter.format(new Date(movement.created_at))}
                  {movement.note ? " · " + movement.note : ""}
                </small>
              </div>
              <span className={"inventory-delta " + (movement.delta < 0 ? "negative" : movement.delta > 0 ? "positive" : "")}>
                {movement.delta > 0 ? "+" : ""}{movement.delta}
              </span>
              <small className="inventory-change">{movement.quantity_before} → {movement.quantity_after}</small>
            </div>
          ))}
        </div>
      ) : (
        <div className="store-inline-empty">
          <strong>Nenhuma movimentação registrada</strong>
          <span>Os ajustes de estoque aparecerão aqui automaticamente.</span>
        </div>
      )}
    </article>
  );
}
