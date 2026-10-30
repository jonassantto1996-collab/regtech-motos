import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "../../../AdminShell";
import { requireAdminSession } from "../../../products/actions";
import { updateStoreProduct } from "../../actions";
import { InventoryHistory } from "../../components/InventoryHistory";
import { StoreImagesManager } from "../../components/StoreImagesManager";
import { StoreSpecsPanel } from "../../components/StoreSpecsPanel";
import { VariantInventoryPanel } from "../../components/VariantInventoryPanel";
import { StoreProductForm } from "../../StoreProductForm";
import "../../../admin.css";
import "../../store.css";
import "../../../products/product-images.css";

const errors: Record<string, string> = {
  missing_fields: "Preencha os campos obrigatórios.",
  field_too_long: "Um dos campos excede o limite.",
  invalid_slug: "URL inválida.",
  invalid_price: "Preço inválido. Use números, por exemplo 1.299,90.",
  invalid_installments: "Número de parcelas inválido (de 1 a 24).",
  card_incomplete: "Para mostrar a condição no cartão, preencha o total no cartão e as parcelas.",
  missing_file: "Escolha pelo menos uma foto.",
  invalid_image: "Foto inválida. Use JPEG, PNG ou WebP de até 5 MB.",
  too_many_images: "Limite de 12 fotos por produto.",
  upload_failed: "Não foi possível enviar a foto. Tente de novo.",
  image_not_found: "Foto não encontrada.",
  delete_failed: "Não foi possível remover a foto.",
  reorder_failed: "Não foi possível mudar a ordem das fotos.",
  invalid_spec: "Preencha o item e a informação da ficha técnica.",
  too_many_specs: "Limite de 40 itens na ficha técnica.",
  invalid_variant: "Variante inválida.",
  invalid_stock: "Quantidade de estoque inválida.",
  note_too_long: "O motivo do ajuste excede 200 caracteres.",
  duplicate: "Slug ou SKU já cadastrado.",
  not_found: "Produto não encontrado.",
  server_error: "Não foi possível salvar.",
};

export default async function EditStoreProduct({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  const { id } = await params;
  await requireAdminSession();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: categories }, { data: product }] = await Promise.all([
    admin.from("store_categories").select("id,name").eq("is_active", true).order("sort_order"),
    admin
      .from("store_products")
      .select("category_id,brand,name,slug,sku,description,price,wholesale_price,card_price,card_installments,warranty,availability,is_active")
      .eq("id", id)
      .maybeSingle(),
  ]);

  if (!product) notFound();

  const [{ data: variants }, { data: movements }, { data: images }, { data: specs }] = await Promise.all([
    admin
      .from("store_product_variants")
      .select("id,name,sku,price,wholesale_price,stock_quantity,low_stock_threshold,is_active")
      .eq("product_id", id)
      .order("created_at"),
    admin
      .from("store_inventory_movements")
      .select("id,variant_id,movement_type,quantity_before,quantity_after,delta,note,created_at")
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    admin
      .from("store_product_images")
      .select("id,storage_path,display_order,alt_text")
      .eq("product_id", id)
      .order("display_order")
      .order("created_at"),
    admin
      .from("store_product_specs")
      .select("id,spec_key,spec_value")
      .eq("product_id", id)
      .order("display_order")
      .order("created_at"),
  ]);

  const { error, created } = await searchParams;
  const errorMessage = error ? errors[error] ?? "Erro ao salvar." : null;

  return (
    <AdminShell active="store" email={data.claims.email}>
      <section className="admin-content admin-page">
        <div className="page-heading store-edit-heading">
          <div>
            <span>LOJA COMPLETA</span>
            <h1>Editar produto</h1>
            <p>{product.brand} {product.name}</p>
          </div>
          <Link href="/admin/store" className="secondary-action">← Voltar para loja</Link>
        </div>

        {created && (
          <p className="admin-alert success" role="status">
            Produto cadastrado. Agora adicione as fotos, a ficha técnica e as variantes com estoque.
          </p>
        )}

        <article className="panel product-editor-panel">
          <StoreProductForm
            mode="edit"
            action={updateStoreProduct.bind(null, id)}
            categories={categories ?? []}
            product={product}
            errorMessage={errorMessage}
          />
        </article>

        <StoreImagesManager productId={id} images={images ?? []} errorMessage={errorMessage} />
        <StoreSpecsPanel productId={id} specs={specs ?? []} />
        <VariantInventoryPanel productId={id} variants={variants ?? []} />
        <InventoryHistory variants={variants ?? []} movements={movements ?? []} />
      </section>
    </AdminShell>
  );
}
