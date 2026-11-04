"use client";

import { useMemo, useState } from "react";
import { brl, buildWhatsAppList, buildWhatsAppListCsv, displayName, type WhatsAppListItem } from "@/lib/store/whatsapp-list";

/** O WhatsApp aceita mensagens de até ~65 mil caracteres; avisa antes disso. */
const WHATSAPP_LIMIT = 60000;

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function WhatsAppListBuilder({
  items,
  categories,
  baseUrl,
  date,
}: {
  items: WhatsAppListItem[];
  categories: string[];
  baseUrl: string;
  date: string;
}) {
  // Começa com a lista completa marcada.
  const [selected, setSelected] = useState<Set<string>>(() => new Set(items.map((i) => i.id)));
  const [category, setCategory] = useState<string>("");
  const [query, setQuery] = useState("");
  const [onlyPriced, setOnlyPriced] = useState(false);
  const [includePrices, setIncludePrices] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [copied, setCopied] = useState<"ok" | "error" | null>(null);

  const visible = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return items.filter((i) => {
      if (category && i.category !== category) return false;
      if (onlyPriced && i.price === null) return false;
      const haystack = normalize(`${i.brand} ${i.name} ${i.category}`);
      return terms.every((t) => haystack.includes(t));
    });
  }, [items, category, query, onlyPriced]);

  const chosen = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);
  const text = useMemo(
    () => (chosen.length ? buildWhatsAppList(chosen, { baseUrl, includePrices, includeLinks, date }) : ""),
    [chosen, baseUrl, includePrices, includeLinks, date],
  );

  function toggle(id: string) {
    setCopied(null);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setVisible(checked: boolean) {
    setCopied(null);
    setSelected((prev) => {
      const next = new Set(prev);
      for (const i of visible) {
        if (checked) next.add(i.id);
        else next.delete(i.id);
      }
      return next;
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied("ok");
    } catch {
      setCopied("error");
    }
  }

  function download() {
    const blob = new Blob([buildWhatsAppListCsv(chosen, baseUrl)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lista-atacado-${date.split("/").reverse().join("-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const visibleSelected = visible.filter((i) => selected.has(i.id)).length;

  return (
    <div className="wa-list">
      <article className="panel wa-list-picker">
        <div className="wa-list-filters">
          <label className="admin-field">
            Buscar
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="admin-control"
              placeholder="Marca ou modelo"
            />
          </label>
          <label className="admin-field">
            Categoria
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="admin-control">
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="form-check wa-list-check">
          <input type="checkbox" checked={onlyPriced} onChange={(e) => setOnlyPriced(e.target.checked)} /> Mostrar só produtos com preço de atacado
        </label>

        <div className="wa-list-bulk">
          <span>
            {visibleSelected} de {visible.length} marcados
          </span>
          <button type="button" className="admin-secondary-button" onClick={() => setVisible(true)}>
            Marcar todos
          </button>
          <button type="button" className="admin-secondary-button" onClick={() => setVisible(false)}>
            Desmarcar todos
          </button>
        </div>

        <ul className="wa-list-items">
          {visible.map((i) => (
            <li key={i.id}>
              <label>
                <input type="checkbox" checked={selected.has(i.id)} onChange={() => toggle(i.id)} />
                <span className="wa-list-name">
                  <strong>{displayName(i)}</strong>
                  <small>
                    {i.category}
                    {i.wholesaleOnly && <em className="status-badge store-badge-wholesale">Só atacado</em>}
                  </small>
                </span>
                <span className={`wa-list-price ${i.price === null ? "is-empty" : ""}`}>
                  {i.price === null ? "Consulte" : `${i.from ? "a partir de " : ""}${brl(i.price)}`}
                </span>
              </label>
            </li>
          ))}
          {!visible.length && <li className="wa-list-empty">Nenhum produto com esse filtro.</li>}
        </ul>
      </article>

      <article className="panel wa-list-preview">
        <div className="wa-list-preview-head">
          <div>
            <span>PRÉVIA DA MENSAGEM</span>
            <h2>
              {chosen.length} produto{chosen.length === 1 ? "" : "s"} na lista
            </h2>
          </div>
        </div>
        <div className="wa-list-options">
          <label className="form-check">
            <input type="checkbox" checked={includePrices} onChange={(e) => { setIncludePrices(e.target.checked); setCopied(null); }} /> Com o preço de atacado
          </label>
          <label className="form-check">
            <input type="checkbox" checked={includeLinks} onChange={(e) => { setIncludeLinks(e.target.checked); setCopied(null); }} /> Com o link de cada produto
          </label>
        </div>
        <textarea readOnly value={text} className="admin-control admin-textarea wa-list-text" placeholder="Marque os produtos para montar a lista." />
        {text.length > WHATSAPP_LIMIT && (
          <p className="admin-alert error">A mensagem passou do limite do WhatsApp. Divida a lista (por categoria, por exemplo).</p>
        )}
        <div className="wa-list-actions">
          <button type="button" className="admin-primary-button" onClick={copy} disabled={!text}>
            Copiar lista
          </button>
          <button type="button" className="admin-secondary-button" onClick={download} disabled={!chosen.length}>
            Baixar planilha
          </button>
        </div>
        {copied === "ok" && (
          <p className="admin-alert success" role="status">
            Lista copiada. Abra o grupo no WhatsApp e cole a mensagem.
          </p>
        )}
        {copied === "error" && (
          <p className="admin-alert error" role="alert">
            Não deu para copiar automaticamente. Toque na caixa da mensagem, selecione tudo e copie.
          </p>
        )}
        <p className="field-hint wa-list-hint">
          O link de cada produto abre para todos, mas o preço de atacado só aparece para o lojista que entrou na Área do Lojista. Produto “só atacado” pede para o lojista entrar antes.
        </p>
      </article>
    </div>
  );
}
