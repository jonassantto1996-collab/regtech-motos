import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminSession, updateProduct } from "../../actions";
import {
  PRODUCT_ERROR_MESSAGES,
  type Product,
  type ProductColor,
  type ProductSpec,
  type ProductImage,
} from "../../types";
import { ProductForm } from "../../ProductForm";
import { ProductImagesManager } from "../../ProductImagesManager";
import { MotoInventoryPanel } from "../../MotoInventoryPanel";
import { AdminShell } from "../../../AdminShell";
import "../../../admin.css";
import "../../moto-inventory.css";
import "../../product-images.css";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; stock_error?: string; stock_saved?: string }>;
}) {
  await requireAdminSession();
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const search = await searchParams;
  const errorMessage = search.error
    ? PRODUCT_ERROR_MESSAGES[search.error]
    : null;

  const admin = createAdminClient();

  const { data: product } = await admin
    .from("products")
    .select(
      "id, brand, model, slug, sku, category, description, price, availability, warranty, pickup_available, is_active, created_at, updated_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!product) {
    return (
      <main
        style={{
          maxWidth: 480,
          margin: "3rem auto",
          padding: "0 1rem",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1>Produto não encontrado</h1>
        <p>
          <Link href="/admin/products">&larr; Voltar para a lista</Link>
        </p>
      </main>
    );
  }

  const [{ data: colors }, { data: specs }, { data: images }, { data: inventory }, { data: movements }] =
    await Promise.all([
      admin
        .from("product_colors")
        .select("id, product_id, color, created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: true }),
      admin
        .from("product_specs")
        .select("id, product_id, spec_key, spec_value, created_at, updated_at")
        .eq("product_id", id)
        .order("created_at", { ascending: true }),
      admin
        .from("product_images")
        .select(
          "id, product_id, storage_path, display_order, is_main, alt_text, created_at"
        )
        .eq("product_id", id)
        .order("display_order", { ascending: true }),
      admin
        .from("moto_inventory")
        .select("id,color,stock_quantity,low_stock_threshold")
        .eq("product_id", id)
        .order("color"),
      admin
        .from("moto_inventory_movements")
        .select("id,movement_type,quantity_before,quantity_after,delta,color,note,created_at")
        .eq("product_id", id)
        .order("created_at", { ascending: false })
        .limit(40),
    ]);

  return (
    <AdminShell active="products" email={claims.claims.email}>
      <main className="admin-content admin-page">
        <div className="page-heading">
          <div><span>CATÁLOGO</span><h1>Editar moto</h1><p>{product.brand} {product.model}</p></div>
          <Link className="secondary-action" href="/admin/products">Voltar para motos</Link>
        </div>
        {search.stock_error && (
          <p className="admin-alert error">
            {search.stock_error === "invalid_quantity"
              ? "Informe uma quantidade inteira maior ou igual a zero."
              : search.stock_error === "note_too_long"
                ? "O motivo do ajuste deve ter no máximo 200 caracteres."
                : "Não foi possível atualizar o estoque da moto."}
          </p>
        )}
        {search.stock_saved && <p className="admin-alert success">Estoque atualizado e movimentação registrada.</p>}

        <section className="panel product-editor-panel">
          <ProductForm
            mode="edit"
            action={updateProduct.bind(null, id)}
            defaultValues={product as Product}
            defaultColors={(colors ?? []) as ProductColor[]}
            defaultSpecs={(specs ?? []) as ProductSpec[]}
            errorMessage={errorMessage}
          />
        </section>
        <MotoInventoryPanel
          productId={id}
          colors={(colors ?? []).map((item) => item.color)}
          inventory={inventory ?? []}
          movements={movements ?? []}
        />
        <section className="panel product-editor-panel images-editor-panel">
          <ProductImagesManager productId={id} images={(images ?? []) as ProductImage[]} errorMessage={errorMessage} />
        </section>
      </main>
    </AdminShell>
  );
}
