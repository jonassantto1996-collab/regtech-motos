import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { uploadCustomHero, useProductHero } from "./actions";
import { requireAdminSession } from "../products/actions";
import { AdminShell } from "../AdminShell";
import "../admin.css";

type SearchParams = Promise<{ error?: string; saved?: string }>;

const errors: Record<string, string> = {
  missing_file: "Selecione uma imagem.",
  invalid_image: "Use uma imagem JPEG, PNG ou WebP de até 5 MB.",
  upload_failed: "Não foi possível enviar a imagem.",
  save_failed: "Não foi possível salvar a configuração do Hero.",
  invalid_product: "Selecione um produto ativo válido.",
};

export default async function AdminHeroPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: settings }, { data: products }] = await Promise.all([
    admin.from("home_hero_settings").select("mode, product_id, storage_path, alt_text, image_position").eq("id", true).maybeSingle(),
    admin.from("products").select("id, brand, model").eq("is_active", true).order("brand").order("model"),
  ]);
  const params = await searchParams;

  return (
    <AdminShell active="hero" email={data.claims.email}><main className="admin-content admin-page hero-admin">
      
      <div className="page-heading"><div><span>HOME</span><h1>Hero da Home</h1></div></div>
      <p className="page-description">Defina a mídia principal da página inicial sem alterar as imagens do catálogo.</p>

      {params.error && <p className="admin-alert error">{errors[params.error] ?? "Ocorreu um erro."}</p>}
      {params.saved && <p className="admin-alert success">Hero atualizado com sucesso.</p>}

      <section className="panel hero-settings-card">
        <h2>Usar uma moto cadastrada</h2>
        <p>Se nenhum modelo for escolhido, a Home volta a usar automaticamente o produto mais recente.</p>
        <form action={useProductHero}>
          <select name="product_id" defaultValue={settings?.mode === "product" ? settings.product_id ?? "" : ""} className="admin-control">
            <option value="">Automático — produto mais recente</option>
            {(products ?? []).map((product) => (
              <option key={product.id} value={product.id}>{product.brand} {product.model}</option>
            ))}
          </select>
          <label className="admin-field">Enquadramento<select name="image_position" defaultValue={settings?.image_position ?? "center"} className="admin-control"><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label><button type="submit" className="admin-primary-button">Usar no Hero</button>
        </form>
      </section>

      <section className="panel hero-settings-card">
        <h2>Enviar imagem exclusiva</h2>
        <p>JPEG, PNG ou WebP, até 5 MB. A imagem será usada apenas no Hero.</p>
        {settings?.mode === "custom" && settings.storage_path && (
          <div className="hero-preview">
            <Image src={getPublicImageUrl(settings.storage_path)} alt={settings.alt_text ?? "Hero atual"} fill style={{ objectFit: "cover", objectPosition: settings.image_position ?? "center" }} />
          </div>
        )}
        <form action={uploadCustomHero}>
          <label className="admin-file"><span>Selecionar imagem</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
          <label className="admin-field">Texto alternativo<input name="alt_text" type="text" placeholder="Descreva a imagem para acessibilidade" className="admin-control" /></label>
          <label className="admin-field">Enquadramento<select name="image_position" defaultValue={settings?.image_position ?? "center"} className="admin-control"><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label><button type="submit" className="admin-primary-button">Enviar e usar no Hero</button>
        </form>
      </section>
    </main></AdminShell>
  );
}
