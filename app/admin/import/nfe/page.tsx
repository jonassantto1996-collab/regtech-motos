import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "../../AdminShell";
import { requireAdminSession } from "../../products/actions";
import { NfeUploadForm } from "./NfeUploadForm";
import "../../admin.css";
import "./import.css";

const errors: Record<string, string> = {
  missing_file: "Selecione o XML da NF-e.",
  file_too_large: "O XML excede o limite de 2 MB.",
  invalid_file_type: "Envie um arquivo XML da NF-e.",
  invalid_xml: "Não foi possível interpretar esse XML como uma NF-e válida.",
  server_error: "Não foi possível importar a nota fiscal.",
};

export default async function NfeImportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminSession();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const { error } = await searchParams;

  return (
    <AdminShell active="store" email={data.claims.email}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>ENTRADA DE MERCADORIA</span>
            <h1>Importar NF-e</h1>
            <p>Envie o XML da nota para carregar todos os itens e revisar a entrada antes de atualizar o estoque.</p>
          </div>
        </div>

        <article className="panel nfe-upload-card">
          <div className="nfe-upload-heading">
            <span className="login-kicker">FASE 1 · XML</span>
            <h2>Adicionar nota fiscal</h2>
            <p>O sistema lê fornecedor, número da nota, produtos, quantidades e valores para preparar a conferência da entrada.</p>
          </div>

          <NfeUploadForm errorMessage={error ? errors[error] ?? "Erro ao importar a NF-e." : null} />
        </article>

        <div className="nfe-explainer">
          <article><strong>1</strong><span><b>Importa</b> todos os itens do XML.</span></article>
          <article><strong>2</strong><span><b>Confere</b> produto, moto, cor e quantidade.</span></article>
          <article><strong>3</strong><span><b>Aplica</b> a entrada e registra o histórico.</span></article>
        </div>
      </section>
    </AdminShell>
  );
}
