import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProduct } from "../actions";
import { PRODUCT_ERROR_MESSAGES } from "../types";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage({
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

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "3rem auto",
        padding: "0 1rem",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Novo produto</h1>
      <p>
        <Link href="/admin/products">&larr; Voltar para a lista</Link>
      </p>
      <ProductForm
        mode="create"
        action={createProduct}
        errorMessage={errorMessage}
      />
    </main>
  );
}
