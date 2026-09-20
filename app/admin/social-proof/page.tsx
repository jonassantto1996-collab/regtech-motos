import Image from "next/image";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { AdminShell } from "../AdminShell";
import { createSocialProof, deleteSocialProof, updateSocialProof } from "./actions";
import "../admin.css";
import "./social-proof.css";

const errors: Record<string,string> = {
  invalid_fields: "Revise os campos preenchidos.",
  authorization_required: "Para publicar, confirme que a imagem tem autorização de uso.",
  missing_file: "Selecione uma foto.",
  invalid_image: "Use JPEG, PNG ou WebP de até 5 MB.",
  upload_failed: "Não foi possível enviar a foto.",
  save_failed: "Não foi possível salvar a prova social.",
  not_found: "Registro não encontrado.",
};

export default async function SocialProofPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const { data: items } = await admin
    .from("home_social_proof")
    .select("id,customer_name,city,product_name,testimonial,storage_path,alt_text,sort_order,is_active,publication_authorized,created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const params = await searchParams;

  return (
    <AdminShell active="social-proof" email={data.claims.email}>
      <main className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>HOME</span>
            <h1>Prova social</h1>
            <p>Gerencie fotos reais de clientes e entregas exibidas na página inicial.</p>
          </div>
        </div>

        {params.error && <p className="admin-alert error">{errors[params.error] ?? "Ocorreu um erro."}</p>}
        {params.saved && <p className="admin-alert success">Prova social atualizada com sucesso.</p>}

        <section className="panel social-proof-create">
          <div className="store-form-heading">
            <div>
              <span>NOVO DESTAQUE</span>
              <h2>Adicionar cliente</h2>
              <p>A seção da Home só aparece quando houver pelo menos uma foto ativa e autorizada.</p>
            </div>
          </div>

          <form action={createSocialProof} className="social-proof-form">
            <label className="admin-file social-proof-file"><span>Selecionar foto</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></label>
            <div className="social-proof-grid">
              <label className="admin-field">Nome do cliente *<input className="admin-control" name="customer_name" maxLength={100} required /></label>
              <label className="admin-field">Cidade<input className="admin-control" name="city" maxLength={100} placeholder="Ex: Tucumã/PA" /></label>
              <label className="admin-field">Modelo da moto<input className="admin-control" name="product_name" maxLength={120} placeholder="Ex: TUI" /></label>
              <label className="admin-field">Ordem<input className="admin-control" name="sort_order" type="number" min="0" max="999" defaultValue="0" /></label>
              <label className="admin-field social-proof-wide">Depoimento<textarea className="admin-control admin-textarea" name="testimonial" maxLength={400} placeholder="Opcional — use apenas uma fala autorizada do cliente." /></label>
              <label className="admin-field social-proof-wide">Texto alternativo *<input className="admin-control" name="alt_text" maxLength={180} required placeholder="Ex: Cliente recebendo sua Regtech TUI" /></label>
            </div>
            <label className="form-check"><input type="checkbox" name="publication_authorized" /> Tenho autorização para publicar esta imagem/depoimento.</label>
            <label className="form-check"><input type="checkbox" name="is_active" /> Exibir na Home agora.</label>
            <button className="admin-primary-button" type="submit">Adicionar prova social</button>
          </form>
        </section>

        <section className="social-proof-admin-list">
          {(items ?? []).length === 0 ? (
            <div className="panel store-inline-empty"><strong>Nenhuma foto cadastrada</strong><span>A Home continuará sem a seção de prova social até você adicionar e ativar uma foto.</span></div>
          ) : (
            (items ?? []).map(item => (
              <article className="panel social-proof-admin-card" key={item.id}>
                <div className="social-proof-admin-image">
                  <Image src={getPublicImageUrl(item.storage_path)} alt={item.alt_text} fill className="object-cover" />
                </div>
                <form action={updateSocialProof.bind(null,item.id)} className="social-proof-edit-form">
                  <div className="social-proof-card-head">
                    <div><strong>{item.customer_name}</strong><span>{item.is_active && item.publication_authorized ? "Publicado" : "Não publicado"}</span></div>
                    <span className={item.is_active && item.publication_authorized ? "status-badge active" : "status-badge"}>{item.is_active && item.publication_authorized ? "Ativo" : "Inativo"}</span>
                  </div>
                  <label className="admin-file"><span>Trocar foto (opcional)</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp" /></label>
                  <div className="social-proof-grid">
                    <label className="admin-field">Nome<input className="admin-control" name="customer_name" maxLength={100} required defaultValue={item.customer_name} /></label>
                    <label className="admin-field">Cidade<input className="admin-control" name="city" maxLength={100} defaultValue={item.city ?? ""} /></label>
                    <label className="admin-field">Modelo<input className="admin-control" name="product_name" maxLength={120} defaultValue={item.product_name ?? ""} /></label>
                    <label className="admin-field">Ordem<input className="admin-control" name="sort_order" type="number" min="0" max="999" defaultValue={item.sort_order} /></label>
                    <label className="admin-field social-proof-wide">Depoimento<textarea className="admin-control admin-textarea" name="testimonial" maxLength={400} defaultValue={item.testimonial ?? ""} /></label>
                    <label className="admin-field social-proof-wide">Texto alternativo<input className="admin-control" name="alt_text" maxLength={180} required defaultValue={item.alt_text} /></label>
                  </div>
                  <label className="form-check"><input type="checkbox" name="publication_authorized" defaultChecked={item.publication_authorized} /> Autorização de publicação confirmada.</label>
                  <label className="form-check"><input type="checkbox" name="is_active" defaultChecked={item.is_active} /> Exibir na Home.</label>
                  <div className="social-proof-actions">
                    <button className="admin-primary-button" type="submit">Salvar alterações</button>
                    <button className="admin-secondary-button social-proof-delete" formAction={deleteSocialProof.bind(null,item.id)} type="submit">Excluir</button>
                  </div>
                </form>
              </article>
            ))
          )}
        </section>
      </main>
    </AdminShell>
  );
}
