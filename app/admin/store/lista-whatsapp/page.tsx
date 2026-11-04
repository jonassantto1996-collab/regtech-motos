import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../../AdminShell";
import { requireAdminSession } from "../../products/actions";
import { CELLSHOP_URL } from "@/lib/cellshop/config";
import { wholesaleSummary, type WhatsAppListItem } from "@/lib/store/whatsapp-list";
import { WhatsAppListBuilder } from "./WhatsAppListBuilder";
import "../../admin.css";
import "../store.css";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  brand: string;
  name: string;
  slug: string;
  category_id: string;
  wholesale_price: number | string | null;
  wholesale_only: boolean;
  store_product_variants: { wholesale_price: number | string | null; is_active: boolean }[];
};

/** Lista de produtos com o preço de atacado para o grupo de lojistas no WhatsApp. */
export default async function WhatsAppListPage() {
  await requireAdminSession();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: categories }, { data: products, error }] = await Promise.all([
    admin.from("store_categories").select("id,name,sort_order").order("sort_order"),
    admin
      .from("store_products")
      .select("id,brand,name,slug,category_id,wholesale_price,wholesale_only,store_product_variants(wholesale_price,is_active)")
      .eq("is_active", true)
      .order("brand")
      .order("name")
      .limit(1000),
  ]);
  if (error) throw new Error("Não foi possível carregar os produtos da loja.");

  const order = new Map((categories ?? []).map((c, i) => [c.id, i]));
  const categoryName = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const items: WhatsAppListItem[] = ((products ?? []) as Row[])
    .sort((a, b) => (order.get(a.category_id) ?? 999) - (order.get(b.category_id) ?? 999))
    .map((p) => {
      const variants = (p.store_product_variants ?? []).filter((v) => v.is_active);
      return {
        id: p.id,
        brand: p.brand,
        name: p.name,
        slug: p.slug,
        category: categoryName.get(p.category_id) ?? "Outros",
        ...wholesaleSummary(p.wholesale_price, variants),
        wholesaleOnly: Boolean(p.wholesale_only),
      };
    });
  const categoryList = [...new Set(items.map((i) => i.category))];
  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Belem" });

  return (
    <AdminShell active="store" email={typeof auth.claims.email === "string" ? auth.claims.email : undefined}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>REGTECH CELL SHOP · ATACADO</span>
            <h1>Lista para WhatsApp</h1>
            <p>Escolha os produtos, copie o texto pronto e cole no grupo de lojistas.</p>
          </div>
          <div className="store-heading-actions">
            <Link href="/admin/store" className="secondary-action">Voltar para a loja</Link>
          </div>
        </div>
        <WhatsAppListBuilder items={items} categories={categoryList} baseUrl={CELLSHOP_URL} date={today} />
      </section>
    </AdminShell>
  );
}
