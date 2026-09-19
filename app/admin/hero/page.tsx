import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { uploadCustomHero, useProductHero } from "./actions";
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
      <p>Defina a mídia principal da página inicial sem alterar as imagens do catálogo.</p>

      {params.error && <p style={{ padding: "0.75rem", background: "#fee2e2" }}>{errors[params.error] ?? "Ocorreu um erro."}</p>}
      {params.saved && <p style={{ padding: "0.75rem", background: "#dcfce7" }}>Hero atualizado com sucesso.</p>}

      <section className="panel hero-settings-card">
        <h2 style={{ marginTop: 0 }}>Usar uma moto cadastrada</h2>
        <p>Se nenhum modelo for escolhido, a Home volta a usar automaticamente o produto mais recente.</p>
        <form action={useProductHero}>
          <select name="product_id" defaultValue={settings?.mode === "product" ? settings.product_id ?? "" : ""} style={{ width: "100%", padding: "0.65rem" }}>
            <option value="">Automático — produto mais recente</option>
            {(products ?? []).map((product) => (
              <option key={product.id} value={product.id}>{product.brand} {product.model}</option>
            ))}
          </select>
          <label style={{ display: "block", marginTop: "1rem" }}>Enquadramento<select name="image_position" defaultValue={settings?.image_position ?? "center"} style={{ display: "block", width: "100%", marginTop: "0.4rem", padding: "0.65rem" }}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label><button type="submit" style={{ marginTop: "1rem", padding: "0.65rem 1rem" }}>Usar no Hero</button>
        </form>
      </section>

      <section className="panel hero-settings-card">
        <h2 style={{ marginTop: 0 }}>Enviar imagem exclusiva</h2>
        <p>JPEG, PNG ou WebP, até 5 MB. A imagem será usada apenas no Hero.</p>
        {settings?.mode === "custom" && settings.storage_path && (
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 7", marginBottom: "1rem", background: "#f3f4f6" }}>
            <Image src={getPublicImageUrl(settings.storage_path)} alt={settings.alt_text ?? "Hero atual"} fill style={{ objectFit: "cover", objectPosition: settings.image_position ?? "center" }} />
          </div>
        )}
        <form action={uploadCustomHero}>
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required />
          <label style={{ display: "block", marginTop: "1rem" }}>
            Texto alternativo
            <input name="alt_text" type="text" placeholder="Ex.: Moto elétrica Regtech" style={{ display: "block", width: "100%", marginTop: "0.4rem", padding: "0.65rem" }} />
          </label>
          <label style={{ display: "block", marginTop: "1rem" }}>Enquadramento<select name="image_position" defaultValue={settings?.image_position ?? "center"} style={{ display: "block", width: "100%", marginTop: "0.4rem", padding: "0.65rem" }}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label><button type="submit" style={{ marginTop: "1rem", padding: "0.65rem 1rem" }}>Enviar e usar no Hero</button>
        </form>
      </section>
    </main></AdminShell>
  );
}
