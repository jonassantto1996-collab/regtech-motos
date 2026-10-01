import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession, toggleProductActive } from "./actions";
import { PRODUCT_ERROR_MESSAGES, type Product } from "./types";
import { AdminShell } from "../AdminShell";
import "../admin.css";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminSession();
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
    <AdminShell active="products" email={claims.claims.email}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div><span>CATÁLOGO</span><h1>Motos</h1><p>Gerencie os modelos exibidos no catálogo público.</p></div>
          <Link className="primary-action" href="/admin/products/new">+ Nova moto</Link>
        </div>

        {errorMessage && <p className="admin-alert error" role="alert">{errorMessage}</p>}
        {error && <p className="admin-alert error" role="alert">Não foi possível carregar os produtos.</p>}
        {!error && products && products.length === 0 && <div className="panel empty-state">Nenhum produto cadastrado ainda.</div>}

        {!error && products && products.length > 0 && (
          <div className="panel admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Marca</th><th>Modelo</th><th>SKU</th><th>Categoria</th><th>Preço</th><th>Disponibilidade</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {(products as Product[]).map((product) => (
                  <tr key={product.id}>
                    <td>{product.brand}</td><td><strong>{product.model}</strong></td><td>{product.sku ?? "—"}</td><td>{product.category}</td>
                    <td>{currencyFormatter.format(product.price)}</td><td>{product.availability}</td>
                    <td><span className={product.is_active ? "status-badge active" : "status-badge"}>{product.is_active ? "Ativo" : "Inativo"}</span></td>
                    <td className="table-actions">
                      <Link href={`/admin/products/${product.id}/edit`}>Editar</Link>
                      <form action={toggleProductActive.bind(null, product.id, !product.is_active)}>
                        <button type="submit">{product.is_active ? "Desativar" : "Ativar"}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );}

