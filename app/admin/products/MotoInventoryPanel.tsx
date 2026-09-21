import { adjustMotoInventoryStock } from "./inventory-actions";

type InventoryRow = {
  id: string;
  color: string;
  stock_quantity: number;
  low_stock_threshold: number;
};

type Movement = {
  id: string;
  movement_type: string;
  quantity_before: number;
  quantity_after: number;
  delta: number;
  color: string;
  note: string | null;
  created_at: string;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Belem",
});

export function MotoInventoryPanel({
  productId,
  colors,
  inventory,
  movements,
}: {
  productId: string;
  colors: string[];
  inventory: InventoryRow[];
  movements: Movement[];
}) {
  const inventoryByColor = new Map(inventory.map((row) => [row.color, row]));
  const availableColors = Array.from(
    new Set([...colors, ...inventory.map((row) => row.color)])
  );
  if (availableColors.length === 0) availableColors.push("Não informada");

  const totalStock = inventory.reduce((sum, row) => sum + row.stock_quantity, 0);

  return (
    <>
      <section className="panel product-editor-panel moto-inventory-panel">
        <div className="moto-stock-heading">
          <div>
            <span>ESTOQUE DA MOTO</span>
            <h2>Quantidade por cor</h2>
            <p>Informe a quantidade física de cada cor. Todo ajuste fica registrado no histórico.</p>
          </div>
          <div className="moto-stock-total">
            <span>Estoque total</span>
            <strong>{totalStock}</strong>
            <small>unidades</small>
          </div>
        </div>

        <div className="moto-stock-list">
          {availableColors.map((color) => {
            const row = inventoryByColor.get(color);
            const quantity = row?.stock_quantity ?? 0;
            const low = quantity <= (row?.low_stock_threshold ?? 1);
            return (
              <article className="moto-stock-row" key={color}>
                <div className="moto-stock-meta">
                  <span>Cor / variação</span>
                  <strong>{color}</strong>
                  <small>{row ? "Estoque já controlado" : "Ainda sem quantidade cadastrada"}</small>
                </div>

                <span className={"stock-pill " + (low ? "low" : "")}>{quantity} un.</span>

                <form action={adjustMotoInventoryStock.bind(null, productId, color)} className="moto-stock-form">
                  <label>
                    <span>Nova quantidade</span>
                    <input
                      className="admin-control"
                      name="stock_quantity"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={quantity}
                      required
                    />
                  </label>
                  <label>
                    <span>Motivo do ajuste</span>
                    <input
                      className="admin-control"
                      name="note"
                      maxLength={200}
                      placeholder="Ex: contagem física"
                    />
                  </label>
                  <button className="admin-secondary-button" type="submit">Atualizar estoque</button>
                </form>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel product-editor-panel moto-history-panel">
        <div className="moto-stock-heading">
          <div>
            <span>RASTREABILIDADE</span>
            <h2>Histórico do estoque</h2>
            <p>Entradas por NF-e e ajustes manuais desta moto.</p>
          </div>
          <span className="status-badge active">{movements.length} movimentações</span>
        </div>

        {movements.length ? (
          <div className="moto-history-list">
            {movements.map((movement) => (
              <div className="moto-history-row" key={movement.id}>
                <div>
                  <strong>{movement.color}</strong>
                  <small>
                    {movement.movement_type === "NFE_ENTRY" ? "Entrada por NF-e" : "Ajuste manual"}
                    {" · "}
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
          <div className="moto-empty-state">
            <strong>Nenhuma movimentação registrada</strong>
            <span>O primeiro ajuste ou entrada por NF-e aparecerá aqui.</span>
          </div>
        )}
      </section>
    </>
  );
}
