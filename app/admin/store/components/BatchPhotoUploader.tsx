"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addStoreProductImagesBatch } from "../media-actions";
import { shrink } from "./StoreImageUploader";
import { MAX_IMAGES_PER_PRODUCT, planBatch, type BatchPlan, type BatchProduct } from "@/lib/store/batch-photos";

type Product = BatchProduct & { isActive: boolean };
type Status = { state: "waiting" | "sending" | "done" | "error"; sent: number; message?: string };

const ACCEPTED = /^image\/(jpeg|png|webp)$/;
const FILES_PER_SEND = 6;

const ERRORS: Record<string, string> = {
  not_found: "produto não encontrado",
  invalid_image: "uma das fotos não é uma imagem válida",
  too_many_images: `passa do limite de ${MAX_IMAGES_PER_PRODUCT} fotos`,
  upload_failed: "falha no envio, tente de novo",
  missing_file: "nenhuma foto",
};

/**
 * Envio de fotos em lote: escolhe a pasta inteira, o sistema lê o código do
 * produto no nome de cada arquivo e coloca cada foto no produto certo.
 */
export function BatchPhotoUploader({ products }: { products: Product[] }) {
  const router = useRouter();
  const folderRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  // Plano "congelado" no início do envio: a lista de fotos de cada produto não
  // muda depois que a página recarrega a contagem de fotos já salvas.
  const [frozenPlan, setFrozenPlan] = useState<BatchPlan<File> | null>(null);

  // "Selecionar pasta" (atributo que o React não tipa).
  useEffect(() => {
    folderRef.current?.setAttribute("webkitdirectory", "");
  }, []);

  const livePlan = useMemo(() => planBatch(files.map((file) => ({ file, name: file.name })), products), [files, products]);
  const plan = frozenPlan ?? livePlan;
  const previews = useMemo(() => new Map(files.map((f) => [f, URL.createObjectURL(f)])), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const hiddenIds = useMemo(() => new Set(products.filter((p) => !p.isActive).map((p) => p.id)), [products]);
  const totalToSend = plan.groups.reduce((sum, g) => sum + g.items.length, 0);
  const totalOverflow = plan.groups.reduce((sum, g) => sum + g.overflow.length, 0);
  const sentCount = Object.values(statuses).reduce((sum, s) => sum + s.sent, 0);
  const failedGroups = plan.groups.filter((g) => statuses[g.product.id]?.state === "error");

  function pick(list: FileList | null) {
    const all = Array.from(list ?? []);
    const images = all.filter((f) => ACCEPTED.test(f.type));
    setFiles(images);
    setIgnored(all.filter((f) => !ACCEPTED.test(f.type) && !f.name.startsWith(".") && f.name !== "desktop.ini").map((f) => f.name));
    setStatuses({});
    setFinished(false);
    setFrozenPlan(null);
  }

  async function send() {
    setFrozenPlan(plan);
    setRunning(true);
    setFinished(false);
    for (const group of plan.groups) {
      const id = group.product.id;
      if (group.items.length === 0 || statuses[id]?.state === "done") continue;
      // As fotos são salvas em ordem: se já entraram N, recomeça da foto N+1 (sem duplicar).
      let sent = statuses[id]?.sent ?? 0;
      setStatuses((s) => ({ ...s, [id]: { state: "sending", sent } }));
      let error: string | undefined;
      for (let i = sent; i < group.items.length && !error; i += FILES_PER_SEND) {
        const formData = new FormData();
        try {
          for (const item of group.items.slice(i, i + FILES_PER_SEND)) formData.append("files", await shrink(item.file));
        } catch {
          error = "não foi possível ler uma das fotos";
          break;
        }
        try {
          const result = await addStoreProductImagesBatch(id, formData);
          sent += result.added;
          if (!result.ok) error = ERRORS[result.error] ?? "falha no envio";
        } catch {
          error = "sem conexão, tente de novo";
        }
        setStatuses((s) => ({ ...s, [id]: { state: "sending", sent } }));
      }
      setStatuses((s) => ({ ...s, [id]: error ? { state: "error", sent, message: error } : { state: "done", sent } }));
    }
    setRunning(false);
    setFinished(true);
    router.refresh();
  }

  function reset() {
    setFiles([]);
    setIgnored([]);
    setStatuses({});
    setFinished(false);
    setFrozenPlan(null);
  }

  return (
    <>
      <article className="panel batch-panel">
        <div className="batch-intro">
          <div>
            <span className="batch-kicker">PASSO 1</span>
            <h2>Escolha as fotos</h2>
            <p>
              O nome de cada foto precisa ser o <strong>código do produto</strong> com o número da foto no fim. A foto 1 é a
              principal, a que aparece na vitrine. Exemplo: <code>samsung-galaxy-a17-1.jpg</code>,{" "}
              <code>samsung-galaxy-a17-2.jpg</code>.
            </p>
          </div>
          <div className="batch-pickers">
            <label className="admin-primary-button batch-picker">
              Selecionar a pasta
              <input ref={folderRef} type="file" multiple onChange={(e) => pick(e.target.files)} disabled={running} />
            </label>
            <label className="admin-secondary-button batch-picker">
              Selecionar fotos
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => pick(e.target.files)} disabled={running} />
            </label>
          </div>
        </div>
      </article>

      {files.length + ignored.length > 0 && (
        <article className="panel batch-panel">
          <div className="batch-summary">
            <div>
              <span className="batch-kicker">PASSO 2</span>
              <h2>Confira antes de enviar</h2>
              <p>
                <strong>{totalToSend}</strong> {totalToSend === 1 ? "foto" : "fotos"} para <strong>{plan.groups.length}</strong>{" "}
                {plan.groups.length === 1 ? "produto" : "produtos"}
                {plan.unmatched.length > 0 && <> · <strong className="batch-warn">{plan.unmatched.length} sem produto</strong></>}
                {totalOverflow > 0 && <> · <strong className="batch-warn">{totalOverflow} acima do limite</strong></>}
              </p>
            </div>
            <div className="batch-actions">
              {!finished && (
                <button type="button" className="admin-primary-button" onClick={send} disabled={running || totalToSend === 0}>
                  {running ? `Enviando… ${sentCount} de ${totalToSend}` : `Enviar ${totalToSend} ${totalToSend === 1 ? "foto" : "fotos"}`}
                </button>
              )}
              {!running && (
                <button type="button" className="admin-secondary-button" onClick={reset}>
                  Escolher outras fotos
                </button>
              )}
            </div>
          </div>

          {finished && (
            <p className={`admin-alert ${failedGroups.length ? "error" : "success"}`} role="status">
              {failedGroups.length
                ? `${sentCount} fotos enviadas. ${failedGroups.length} ${failedGroups.length === 1 ? "produto ficou" : "produtos ficaram"} com erro: clique em “Tentar de novo”.`
                : `Pronto! ${sentCount} fotos enviadas para ${plan.groups.filter((g) => g.items.length).length} produtos. Já aparecem na loja.`}
            </p>
          )}
          {finished && failedGroups.length > 0 && (
            <button type="button" className="admin-primary-button batch-retry" onClick={send}>
              Tentar de novo
            </button>
          )}

          {plan.unmatched.length > 0 && (
            <div className="batch-unmatched" role="alert">
              <strong>Estas fotos não foram reconhecidas e não serão enviadas</strong>
              <p>Renomeie com o código do produto (lista no fim da página) e selecione de novo.</p>
              <ul>{plan.unmatched.map((name) => <li key={name}>{name}</li>)}</ul>
            </div>
          )}
          {ignored.length > 0 && (
            <p className="form-muted batch-ignored">
              {ignored.length} {ignored.length === 1 ? "arquivo ignorado" : "arquivos ignorados"} (não é JPG, PNG ou WebP): {ignored.join(", ")}
            </p>
          )}

          <ul className="batch-groups">
            {plan.groups.map((group) => {
              const status = statuses[group.product.id];
              return (
                <li key={group.product.id} className={`batch-group is-${status?.state ?? "waiting"}`}>
                  <div className="batch-group-head">
                    <div>
                      <strong>
                        {group.product.label}
                        {hiddenIds.has(group.product.id) && <span className="status-badge batch-hidden-badge">Escondido na loja</span>}
                      </strong>
                      <small>
                        {group.product.slug}
                        {group.product.imageCount > 0 && ` · já tem ${group.product.imageCount} ${group.product.imageCount === 1 ? "foto" : "fotos"} (as novas entram depois)`}
                      </small>
                    </div>
                    <span className="batch-status">
                      {!status && `${group.items.length} ${group.items.length === 1 ? "foto" : "fotos"}`}
                      {status?.state === "sending" && `Enviando… ${status.sent}/${group.items.length}`}
                      {status?.state === "done" && `✓ ${status.sent} enviadas`}
                      {status?.state === "error" && `Erro: ${status.message}${status.sent ? ` (${status.sent} enviadas)` : ""}`}
                    </span>
                  </div>
                  <div className="batch-thumbs">
                    {group.items.map((item, index) => (
                      <figure key={item.fileName}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previews.get(item.file)} alt={item.fileName} />
                        <figcaption>{index === 0 && group.product.imageCount === 0 ? "Principal" : `Foto ${group.product.imageCount + index + 1}`}</figcaption>
                      </figure>
                    ))}
                  </div>
                  {group.overflow.length > 0 && (
                    <p className="batch-warn batch-overflow">
                      Limite de {MAX_IMAGES_PER_PRODUCT} fotos por produto: {group.overflow.map((i) => i.fileName).join(", ")} não {group.overflow.length === 1 ? "será enviada" : "serão enviadas"}.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      )}

      <article className="panel batch-panel">
        <details className="batch-codes">
          <summary>Ver os códigos dos produtos ({products.length})</summary>
          <table className="admin-table">
            <thead>
              <tr><th>Produto</th><th>Código para o nome da foto</th><th>Fotos</th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/admin/store/${p.id}/edit#fotos`}>{p.label}</Link>
                    {!p.isActive && <span className="status-badge batch-hidden-badge">Escondido</span>}
                  </td>
                  <td><code>{p.slug}</code></td>
                  <td>{p.imageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </article>
    </>
  );
}
