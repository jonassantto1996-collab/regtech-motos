import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateProduct } from "../../actions";
import {
  PRODUCT_ERROR_MESSAGES,
  type Product,
  type ProductColor,
  type ProductSpec,
} from "../../types";
import { ProductForm } from "../../ProductForm";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
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

  const [{ data: colors }, { data: specs }] = await Promise.all([
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
  ]);

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "3rem auto",
        padding: "0 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Editar produto</h1>
      <p>
        <Link href="/admin/products">&larr; Voltar para a lista</Link>
      </p>
      <ProductForm
        mode="edit"
        action={updateProduct.bind(null, id)}
        defaultValues={product as Product}
        defaultColors={(colors ?? []) as ProductColor[]}
        defaultSpecs={(specs ?? []) as ProductSpec[]}
        errorMessage={errorMessage}
      />
    </main>
  );
}
