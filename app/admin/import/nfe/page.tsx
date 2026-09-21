import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "../../AdminShell";
import { requireAdminSession } from "../../products/actions";
import { NfeUploadForm } from "./NfeUploadForm";
import "../../admin.css";
import "./import.css";

const errors: Record<string, string> = {
  missing_file: "Selecione o XML ou PDF da NF-e.",
  file_too_large: "O arquivo excede o limite permitido (XML 2 MB · PDF 10 MB).",
  invalid_file_type: "Envie um arquivo XML ou PDF da NF-e.",
  invalid_xml: "Não foi possível interpretar esse XML como uma NF-e válida.",
  invalid_pdf: "O PDF enviado não é um DANFE válido ou está corrompido.",
  pdf_unreadable: "Recebemos o PDF, mas não foi possível ler os itens com segurança. Use o XML da NF-e para evitar entrada incorreta no estoque.",
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
            <p>Envie o XML ou PDF da nota para carregar os itens e revisar a entrada antes de atualizar o estoque.</p>
          </div>
        </div>

        <article className="panel nfe-upload-card">
          <div className="nfe-upload-heading">
            <span className="login-kicker">FASE 1 · XML OU PDF</span>
            <h2>Adicionar nota fiscal</h2>
            <p>O sistema prioriza o XML e também aceita DANFE em PDF com texto legível. Em ambos os casos, a entrada só ocorre após sua conferência.</p>
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
