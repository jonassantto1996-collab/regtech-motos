import Image from "next/image";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getHomeMediaUrl } from "@/lib/supabase/storage";
import { AdminShell } from "../AdminShell";
import { saveHomeEditorial } from "./actions";
import "../admin.css";
import "./editorial.css";

const errors: Record<string,string> = {
  invalid_fields: "Revise os campos obrigatórios.",
  invalid_link: "O link do botão deve começar com /.",
  invalid_image: "Use JPEG, PNG ou WebP de até 15 MB.",
  dimensions_unknown: "Não foi possível identificar a resolução dessa imagem.",
  resolution_too_low: "A imagem precisa ter pelo menos 1920 × 1080 (ou 1080 × 1920). Para melhor resultado, use 4K.",
  upload_failed: "Não foi possível enviar a imagem.",
  save_failed: "Não foi possível salvar o destaque da Home.",
};

export default async function EditorialAdminPage({
  searchParams,
}: {
  searchParams: Promise<{error?:string;saved?:string}>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from("home_editorial_settings")
    .select("eyebrow,title,description,cta_label,cta_href,storage_path,alt_text,image_position,is_active,image_width,image_height")
    .eq("id", true)
    .maybeSingle();

  const params = await searchParams;
  const imageSrc = settings?.storage_path
    ? getHomeMediaUrl(settings.storage_path)
    : "/regtech-entrega-home.webp";

  return (
    <AdminShell active="editorial" email={data.claims.email}>
      <main className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>HOME</span>
            <h1>Destaque da Home</h1>
            <p>Controle a seção “Uma nova experiência” e substitua a foto sem alterar o código do site.</p>
          </div>
        </div>

        {params.error && <p className="admin-alert error">{errors[params.error] ?? "Ocorreu um erro."}</p>}
        {params.saved && <p className="admin-alert success">Destaque atualizado com sucesso.</p>}

        <section className="panel editorial-admin-card">
          <div className="editorial-preview">
            <Image
              src={imageSrc}
              alt={settings?.alt_text ?? "Entrega Regtech Motors"}
              fill
              quality={95}
              className={
                settings?.image_position === "left"
                  ? "object-cover object-left"
                  : settings?.image_position === "right"
                    ? "object-cover object-right"
                    : "object-cover object-center"
              }
            />
            <div className="editorial-resolution">
              {settings?.image_width && settings?.image_height
                ? `${settings.image_width} × ${settings.image_height}px`
                : "Imagem atual de fallback"}
            </div>
          </div>

          <form action={saveHomeEditorial} className="editorial-admin-form">
            <div className="store-form-heading">
              <div>
                <span>CONTEÚDO EDITORIAL</span>
                <h2>Imagem e texto da seção</h2>
                <p>Para máxima nitidez, envie uma imagem 4K. O sistema bloqueia arquivos abaixo de Full HD.</p>
              </div>
            </div>

            <label className="admin-file editorial-file">
              <span>Substituir imagem</span>
              <input name="file" type="file" accept="image/jpeg,image/png,image/webp" />
              <small>JPEG, PNG ou WebP · até 15 MB · mínimo 1920 × 1080 · ideal 3840 × 2160.</small>
            </label>

            <div className="editorial-grid">
              <label className="admin-field">Linha de apoio<input className="admin-control" name="eyebrow" required maxLength={80} defaultValue={settings?.eyebrow ?? "Mobilidade elétrica"} /></label>
              <label className="admin-field">Enquadramento<select className="admin-control" name="image_position" defaultValue={settings?.image_position ?? "center"}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label>
              <label className="admin-field editorial-wide">Título<input className="admin-control" name="title" required maxLength={180} defaultValue={settings?.title ?? "Uma nova experiência para se movimentar."} /></label>
              <label className="admin-field editorial-wide">Descrição<textarea className="admin-control admin-textarea" name="description" required maxLength={500} defaultValue={settings?.description ?? "Explore os modelos elétricos disponíveis, conheça os detalhes de cada moto e escolha qual deseja consultar com a equipe Regtech."} /></label>
              <label className="admin-field">Texto do botão<input className="admin-control" name="cta_label" required maxLength={60} defaultValue={settings?.cta_label ?? "Comparar modelos"} /></label>
              <label className="admin-field">Link do botão<input className="admin-control" name="cta_href" required maxLength={300} defaultValue={settings?.cta_href ?? "/products"} /></label>
              <label className="admin-field editorial-wide">Texto alternativo<input className="admin-control" name="alt_text" required maxLength={180} defaultValue={settings?.alt_text ?? "Entrega de uma moto elétrica a cliente na Regtech Motors"} /></label>
            </div>

            <label className="form-check">
              <input type="checkbox" name="is_active" defaultChecked={settings?.is_active ?? true} />
              Exibir esta seção na Home.
            </label>

            <button className="admin-primary-button" type="submit">Salvar destaque da Home</button>
          </form>
        </section>
      </main>
    </AdminShell>
  );
}
