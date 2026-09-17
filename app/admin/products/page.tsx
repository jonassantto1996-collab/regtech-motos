import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toggleProductActive } from "./actions";
import { PRODUCT_ERROR_MESSAGES, type Product } from "./types";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const errorMessage = params.error
    ? PRODUCT_ERROR_MESSAGES[params.error]
    : null;

  const admin = createAdminClient();
  const { data: products, error } = await admin
    .from("products")
    .select(
      "id, brand, model, slug, sku, category, description, price, availability, warranty, pickup_available, is_active, created_at, updated_at"
    )
    .order("created_at", { ascending: false });

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "3rem auto",
        padding: "0 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1>Produtos</h1>
        <Link href="/admin/products/new">+ Novo produto</Link>
      </div>

      <p>
        <Link href="/admin">&larr; Voltar para área administrativa</Link>
      </p>

      {errorMessage && (
        <p role="alert" style={{ color: "#c0392b" }}>
          {errorMessage}
        </p>
      )}

      {error && (
        <p role="alert" style={{ color: "#c0392b" }}>
          Não foi possível carregar os produtos.
        </p>
      )}

      {!error && products && products.length === 0 && (
        <p>Nenhum produto cadastrado ainda.</p>
      )}

      {!error && products && products.length > 0 && (
        <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "2px solid #ddd" }}>
              <th style={thStyle}>Marca</th>
              <th style={thStyle}>Modelo</th>
              <th style={thStyle}>SKU</th>
              <th style={thStyle}>Categoria</th>
              <th style={thStyle}>Preço</th>
              <th style={thStyle}>Disponibilidade</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(products as Product[]).map((product) => (
              <tr key={product.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={tdStyle}>{product.brand}</td>
                <td style={tdStyle}>{product.model}</td>
                <td style={tdStyle}>{product.sku ?? "—"}</td>
                <td style={tdStyle}>{product.category}</td>
                <td style={tdStyle}>{currencyFormatter.format(product.price)}</td>
                <td style={tdStyle}>{product.availability}</td>
                <td style={tdStyle}>
                  {product.is_active ? "Ativo" : "Inativo"}
                </td>
                <td style={tdStyle}>
                  <Link href={`/admin/products/${product.id}/edit`}>
                    Editar
                  </Link>
                  {" · "}
                  <form
                    action={toggleProductActive.bind(
                      null,
                      product.id,
                      !product.is_active
                    )}
                    style={{ display: "inline" }}
                  >
                    <button
                      type="submit"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#2563eb",
                        cursor: "pointer",
                        padding: 0,
                        font: "inherit",
                        textDecoration: "underline",
                      }}
                    >
                      {product.is_active ? "Desativar" : "Ativar"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </main>
  );
}

const thStyle = { padding: "0.5rem" };
const tdStyle = { padding: "0.5rem" };
