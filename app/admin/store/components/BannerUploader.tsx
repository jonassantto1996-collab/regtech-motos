"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createStoreBanner } from "../banners/actions";
import { BannerLinkPicker } from "./BannerLinkPicker";
import {
  BANNER_DEVICES,
  DEVICE_LABEL,
  DEVICE_RANGE,
  MAX_BANNERS,
  planBanners,
  type BannerCategory,
  type BannerDevice,
  type BannerFile,
  type BannerGroup,
} from "@/lib/store/banners";

const ACCEPTED = /^image\/(jpeg|png|webp)$/;
const MAX_SIDE = 2560;

type Status = { state: "waiting" | "sending" | "done" | "error"; message?: string };
type Group = BannerGroup<File> & { id: string };

async function measure(file: File): Promise<BannerFile<File> | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const item = { file, path: file.webkitRelativePath || file.name, width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return item;
  } catch {
    return null;
  }
}

/** Reduz para no máximo 2560 px no lado maior (JPEG). Arquivo leve e no tamanho certo fica como está. */
async function prepare(item: BannerFile<File>): Promise<{ file: File; width: number; height: number }> {
  const { file, width, height } = item;
  if (Math.max(width, height) <= MAX_SIDE && file.size <= 1.8 * 1024 * 1024 && file.type !== "image/png") return { file, width, height };
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { file, width, height };
  ctx.fillStyle = "#070a12";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.88));
  if (!blob) return { file, width, height };
  return { file: new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" }), width: w, height: h };
}

function ratioLabel(width: number, height: number) {
  return `${width} × ${height}`;
}

/**
 * Envio dos banners: escolhe a pasta (ou as imagens), o sistema junta as 3
 * versões de cada banner (computador, tablet e celular) e sugere o link.
 */
export function BannerUploader({ categories, existingCount }: { categories: BannerCategory[]; existingCount: number }) {
  const router = useRouter();
  const folderRef = useRef<HTMLInputElement>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [reading, setReading] = useState(false);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    folderRef.current?.setAttribute("webkitdirectory", "");
  }, []);

  const previews = useMemo(() => {
    const map = new Map<File, string>();
    for (const g of groups) {
      for (const item of [...Object.values(g.versions), ...g.extra]) if (item) map.set(item.file, URL.createObjectURL(item.file));
    }
    return map;
  }, [groups]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const room = Math.max(0, MAX_BANNERS - existingCount);
  const ready = groups.filter((g) => g.versions.desktop && g.title.trim());
  const pending = ready.filter((g) => statuses[g.id]?.state !== "done");
  const blocked = groups.length - ready.length;

  async function pick(list: FileList | null) {
    const all = Array.from(list ?? []);
    setReading(true);
    setFinished(false);
    setStatuses({});
    const images = all.filter((f) => ACCEPTED.test(f.type));
    setIgnored(all.filter((f) => !ACCEPTED.test(f.type) && !f.name.startsWith(".") && f.name !== "desktop.ini").map((f) => f.name));
    const measured = (await Promise.all(images.map(measure))).filter((m): m is BannerFile<File> => Boolean(m));
    setGroups(planBanners(measured, categories).map((g, i) => ({ ...g, id: `${g.key}-${i}` })));
    setReading(false);
  }

  function edit(id: string, change: Partial<Group>) {
    setGroups((list) => list.map((g) => (g.id === id ? { ...g, ...change } : g)));
  }

  /** Muda a tela de uma imagem; se a tela já tinha imagem, as duas trocam de lugar. */
  function moveVersion(group: Group, from: BannerDevice, to: BannerDevice) {
    const versions = { ...group.versions };
    const a = versions[from];
    versions[from] = versions[to];
    versions[to] = a;
    if (!versions[from]) delete versions[from];
    edit(group.id, { versions });
  }

  async function send() {
    setRunning(true);
    setFinished(false);
    let slots = room;
    for (const group of ready) {
      if (statuses[group.id]?.state === "done") continue;
      if (slots <= 0) {
        setStatuses((s) => ({ ...s, [group.id]: { state: "error", message: `limite de ${MAX_BANNERS} banners` } }));
        continue;
      }
      setStatuses((s) => ({ ...s, [group.id]: { state: "sending" } }));
      const formData = new FormData();
      formData.set("title", group.title.trim());
      formData.set("link", group.link);
      try {
        for (const device of BANNER_DEVICES) {
          const item = group.versions[device];
          if (!item) continue;
          const prepared = await prepare(item);
          formData.set(device, prepared.file);
          formData.set(`${device}_width`, String(prepared.width));
          formData.set(`${device}_height`, String(prepared.height));
        }
      } catch {
        setStatuses((s) => ({ ...s, [group.id]: { state: "error", message: "não foi possível ler uma das imagens" } }));
        continue;
      }
      try {
        const result = await createStoreBanner(formData);
        if (result.ok) slots -= 1;
        setStatuses((s) => ({ ...s, [group.id]: result.ok ? { state: "done" } : { state: "error", message: result.error } }));
      } catch {
        setStatuses((s) => ({ ...s, [group.id]: { state: "error", message: "sem conexão, tente de novo" } }));
      }
    }
    setRunning(false);
    setFinished(true);
    router.refresh();
  }

  function reset() {
    setGroups([]);
    setIgnored([]);
    setStatuses({});
    setFinished(false);
  }

  const doneCount = Object.values(statuses).filter((s) => s.state === "done").length;
  const errorCount = Object.values(statuses).filter((s) => s.state === "error").length;

  return (
    <>
      <article className="panel batch-panel">
        <div className="batch-intro">
          <div>
            <span className="batch-kicker">NOVOS BANNERS</span>
            <h2>Escolha a pasta com os banners</h2>
            <p>
              Cada banner tem 3 versões: <strong>computador</strong>, <strong>tablet</strong> e <strong>celular</strong>. Coloque a
              tela no nome do arquivo, por exemplo <code>iphone-desktop.jpg</code>, <code>iphone-tablet.jpg</code> e{" "}
              <code>iphone-mobile.jpg</code> (ou separe em pastas “desktop”, “tablet” e “mobile”). Sem a tela no nome, o sistema
              usa o formato da imagem: larga é computador, em pé é celular. Dá para corrigir antes de publicar.
            </p>
          </div>
          <div className="batch-pickers">
            <label className="admin-primary-button batch-picker">
              Selecionar a pasta
              <input ref={folderRef} type="file" multiple onChange={(e) => pick(e.target.files)} disabled={running || reading} />
            </label>
            <label className="admin-secondary-button batch-picker">
              Selecionar imagens
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => pick(e.target.files)} disabled={running || reading} />
            </label>
          </div>
        </div>
        {reading && <p className="form-muted banner-reading">Lendo as imagens…</p>}
        <p className="form-muted banner-zip-note">Se os banners estão num arquivo .zip, extraia antes (botão direito → “Extrair tudo”).</p>
      </article>

      {(groups.length > 0 || ignored.length > 0) && (
        <article className="panel batch-panel">
          <div className="batch-summary">
            <div>
              <span className="batch-kicker">CONFIRA ANTES DE PUBLICAR</span>
              <h2>
                {groups.length} {groups.length === 1 ? "banner encontrado" : "banners encontrados"}
              </h2>
              <p>
                Confira a tela de cada imagem, o nome e para onde o banner leva quando o cliente clica.
                {blocked > 0 && <> <strong className="batch-warn">{blocked} sem a versão do computador (obrigatória).</strong></>}
                {ready.length > room && <> <strong className="batch-warn">Cabem só mais {room} (limite de {MAX_BANNERS}).</strong></>}
              </p>
            </div>
            <div className="batch-actions">
              {pending.length > 0 && (
                <button type="button" className="admin-primary-button" onClick={send} disabled={running || room === 0}>
                  {running ? `Publicando… ${doneCount} de ${ready.length}` : errorCount ? "Tentar de novo" : `Publicar ${pending.length} ${pending.length === 1 ? "banner" : "banners"}`}
                </button>
              )}
              {!running && (
                <button type="button" className="admin-secondary-button" onClick={reset}>
                  {finished && !errorCount ? "Enviar outros banners" : "Escolher outras imagens"}
                </button>
              )}
            </div>
          </div>

          {finished && (
            <p className={`admin-alert ${errorCount ? "error" : "success"}`} role="status">
              {errorCount
                ? `${doneCount} publicados. ${errorCount} com erro: veja abaixo e clique em “Tentar de novo”.`
                : `Pronto! ${doneCount} ${doneCount === 1 ? "banner publicado" : "banners publicados"}. Já aparecem no topo da loja.`}
            </p>
          )}
          {ignored.length > 0 && (
            <p className="form-muted batch-ignored">
              {ignored.length} {ignored.length === 1 ? "arquivo ignorado" : "arquivos ignorados"} (não é JPG, PNG ou WebP): {ignored.join(", ")}
            </p>
          )}

          <ul className="batch-groups">
            {groups.map((group) => {
              const status = statuses[group.id];
              const locked = running || status?.state === "done";
              return (
                <li key={group.id} className={`batch-group banner-group is-${status?.state ?? "waiting"}`}>
                  <div className="batch-group-head">
                    <div>
                      <strong>{group.title || "Banner sem nome"}</strong>
                      <small>{group.key}</small>
                    </div>
                    <span className="batch-status">
                      {!status && (group.versions.desktop ? `${Object.keys(group.versions).length} de 3 versões` : "Falta a versão do computador")}
                      {status?.state === "sending" && "Publicando…"}
                      {status?.state === "done" && "✓ Publicado"}
                      {status?.state === "error" && `Erro: ${status.message}`}
                    </span>
                  </div>

                  <div className="banner-slots">
                    {BANNER_DEVICES.map((device) => {
                      const item = group.versions[device];
                      return (
                        <figure key={device} className={`banner-slot is-${device} ${item ? "" : "is-empty"}`}>
                          <figcaption>
                            <strong>{DEVICE_LABEL[device]}</strong>
                            <small>{DEVICE_RANGE[device]}</small>
                          </figcaption>
                          {item ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={previews.get(item.file)} alt={`${group.title}: ${DEVICE_LABEL[device]}`} />
                              <span className="banner-slot-meta">
                                {ratioLabel(item.width, item.height)}
                                <select
                                  aria-label={`Tela da imagem ${item.path}`}
                                  className="banner-slot-select"
                                  value={device}
                                  disabled={locked}
                                  onChange={(e) => moveVersion(group, device, e.target.value as BannerDevice)}
                                >
                                  {BANNER_DEVICES.map((d) => (
                                    <option key={d} value={d}>
                                      {DEVICE_LABEL[d]}
                                    </option>
                                  ))}
                                </select>
                              </span>
                              <small className="banner-slot-file" title={item.path}>{item.path.split("/").pop()}</small>
                            </>
                          ) : (
                            <span className="banner-slot-missing">
                              {device === "desktop" ? "Obrigatória" : `Sem imagem: usa a do ${device === "mobile" ? "tablet" : "computador"}`}
                            </span>
                          )}
                        </figure>
                      );
                    })}
                  </div>

                  <div className="banner-fields">
                    <label className="admin-field">
                      Nome do banner (para o Google e leitores de tela)
                      <input
                        className="admin-control"
                        value={group.title}
                        maxLength={120}
                        disabled={locked}
                        onChange={(e) => edit(group.id, { title: e.target.value })}
                        placeholder="Ex.: iPhone 17 Pro"
                      />
                    </label>
                    <div className="admin-field">
                      Ao clicar, abrir
                      <fieldset disabled={locked} className="banner-fieldset">
                        <BannerLinkPicker categories={categories} value={group.link} onChange={(link) => edit(group.id, { link })} />
                      </fieldset>
                    </div>
                  </div>

                  {group.extra.length > 0 && (
                    <p className="batch-warn batch-overflow">
                      Repetidas (não entram): {group.extra.map((i) => i.path.split("/").pop()).join(", ")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </article>
      )}
    </>
  );
}
