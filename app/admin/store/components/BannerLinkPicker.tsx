"use client";

import { useState } from "react";
import { categoryLink, type BannerCategory } from "@/lib/store/banners";

const CUSTOM = "__custom";

/**
 * "Ao clicar no banner, abrir": uma categoria da loja, nenhum link ou outro
 * endereço (um produto, uma busca). Com `name`, vai junto no formulário.
 */
export function BannerLinkPicker({
  categories,
  value,
  onChange,
  name,
  id,
}: {
  categories: BannerCategory[];
  value: string;
  onChange?: (link: string) => void;
  name?: string;
  id?: string;
}) {
  const known = new Set(["", ...categories.map((c) => categoryLink(c.slug))]);
  const [custom, setCustom] = useState(!known.has(value));
  const [current, setCurrent] = useState(value);

  // Quando o valor muda de fora (ex.: escolheu outras imagens), a tela mostra o novo link.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    if (value !== current) {
      setCurrent(value);
      setCustom(!known.has(value));
    }
  }

  function update(link: string) {
    setCurrent(link);
    onChange?.(link);
  }

  return (
    <div className="banner-link-picker">
      <select
        id={id}
        name={name}
        className="admin-control store-select"
        value={custom ? CUSTOM : current}
        onChange={(e) => {
          if (e.target.value === CUSTOM) {
            setCustom(true);
            update(known.has(current) ? "" : current);
          } else {
            setCustom(false);
            update(e.target.value);
          }
        }}
      >
        <option value="">Sem link (só imagem)</option>
        <optgroup label="Abrir a categoria">
          {categories.map((c) => (
            <option key={c.slug} value={categoryLink(c.slug)}>
              {c.name}
            </option>
          ))}
        </optgroup>
        <option value={CUSTOM}>Outro endereço (produto, busca…)</option>
      </select>
      {custom && (
        <input
          name={name ? "custom_link" : undefined}
          className="admin-control"
          value={current}
          onChange={(e) => update(e.target.value)}
          placeholder="Ex.: /produto/apple-iphone-16 ou ?q=jbl#vitrine"
          maxLength={300}
          aria-label="Endereço do link"
        />
      )}
    </div>
  );
}
