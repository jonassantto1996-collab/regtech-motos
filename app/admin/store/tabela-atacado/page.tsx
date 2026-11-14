import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../../AdminShell";
import { requireAdminSession } from "../../products/actions";
import { CELLSHOP_URL } from "@/lib/cellshop/config";
import { rotatePriceTableLink } from "../actions";
import { CopyLinkButton } from "./CopyLinkButton";
import "../../admin.css";
import "../store.css";

export const dynamic = "force-dynamic";

/** Tabela de atacado do vendedor: o link secreto para mandar no WhatsApp e o botão para trocar o link. */
export default async function PriceTableAdminPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdminSession();
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/admin/login");

  const { saved, error } = await searchParams;
  const admin = createAdminClient();
  const { data } = await admin.from("store_price_table").select("token,created_at").eq("id", true).maybeSingle();
  const link = data?.token ? `${CELLSHOP_URL}/tabela/${data.token}` : null;
  const message = link ? `Tabela de atacado da Regtech Cell Shop (uso interno, não repasse). Salve na tela inicial do celular:\n${link}` : "";
  const created = data?.created_at
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Belem" }).format(new Date(data.created_at))
    : null;

  return (
    <AdminShell active="store" email={typeof auth.claims.email === "string" ? auth.claims.email : undefined}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>REGTECH CELL SHOP</span>
            <h1>Tabela do vendedor</h1>
            <p>
              Os preços de atacado no celular, separados por categoria e com busca, para consultar na hora com o cliente na frente. Abre direto
              pelo link, sem senha, e mostra sempre os preços atuais do painel.
            </p>
          </div>
          <div className="store-heading-actions">
            <Link href="/admin/store" className="secondary-action">← Voltar para a loja</Link>
          </div>
        </div>

        {saved === "novo" && <p className="admin-alert success" role="status">Link novo gerado. O link antigo já não abre mais: mande este para o vendedor.</p>}
        {error && <p className="admin-alert error" role="alert">Não foi possível gerar o link. Tente de novo.</p>}

        {link ? (
          <article className="panel">
            <h2>Link da tabela</h2>
            <p className="form-muted">Gerado em {created}. Quem tiver este link vê os preços de atacado: mande só para quem trabalha na loja.</p>
            <input readOnly value={link} aria-label="Link da tabela" className="admin-control mt-3 font-mono" />
            <div className="store-heading-actions mt-3">
              <CopyLinkButton link={link} />
              <a className="admin-secondary-button" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">
                Enviar pelo WhatsApp
              </a>
              <a className="admin-secondary-button" href={link} target="_blank" rel="noreferrer">
                Abrir tabela
              </a>
            </div>
          </article>
        ) : (
          <article className="panel">
            <h2>Link da tabela</h2>
            <p className="form-muted">Ainda não existe um link. Gere o primeiro abaixo.</p>
          </article>
        )}

        <article className="panel">
          <h2>Trocar o link</h2>
          <p className="form-muted">
            Use se o link foi parar com quem não devia ou se um vendedor saiu da loja. O link atual para de funcionar na hora e você manda o novo
            para a equipe.
          </p>
          <form action={rotatePriceTableLink} className="mt-3">
            <button type="submit" className="admin-secondary-button reseller-danger">{link ? "Gerar link novo (desativa o atual)" : "Gerar link"}</button>
          </form>
        </article>

        <article className="panel">
          <h2>Como o vendedor usa</h2>
          <ol className="form-muted list-decimal space-y-1 pl-5">
            <li>Abre o link no celular (pelo WhatsApp mesmo).</li>
            <li>No navegador, toca em Compartilhar (iPhone) ou ⋮ (Android) e escolhe “Adicionar à tela inicial”. Fica um ícone, como um app.</li>
            <li>Com o cliente na frente: toca na aba (iPhone, Carregadores, Bombox…) ou digita na busca, e já vê o preço de atacado.</li>
          </ol>
          <p className="form-muted mt-2">
            Aparecem só os produtos ativos com preço de atacado cadastrado. Mudou um preço no painel? A tabela mostra o novo na próxima vez que
            ele abrir, ou no botão “Atualizar”.
          </p>
        </article>
      </section>
    </AdminShell>
  );
}
