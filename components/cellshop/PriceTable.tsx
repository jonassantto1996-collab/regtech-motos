"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/cellshop/pricing";
import { filterPriceTable, type PriceItem, type PriceSection } from "@/lib/cellshop/price-table";
import { getPublicImageUrl } from "@/lib/supabase/storage";

const ALL = "todos";
/** Voltou para a tabela depois de 1 minuto fora: busca os preços de novo. */
const REFRESH_AFTER_MS = 60_000;

/**
 * Tabela de atacado do vendedor: abas por categoria, busca e preço grande.
 * Feita para o celular, para consultar rápido com o cliente na frente.
 */
export default function PriceTable({ sections, updatedLabel }: { sections: PriceSection[]; updatedLabel: string }) {
  const router = useRouter();
  const [tab, setTab] = useState(ALL);
  const [query, setQuery] = useState("");
  const [refreshing, startRefresh] = useTransition();
  const listTop = useRef<HTMLDivElement>(null);

  const total = useMemo(() => sections.reduce((n, s) => n + s.items.length, 0), [sections]);
  const searching = query.trim().length > 0;
  const shown = useMemo(() => {
    if (searching) return filterPriceTable(sections, query);
    return tab === ALL ? sections : sections.filter((s) => s.id === tab);
  }, [sections, tab, query, searching]);
  const found = shown.reduce((n, s) => n + s.items.length, 0);

  // Abriu de novo (voltou do WhatsApp, desbloqueou o celular): preços atualizados.
  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt >= REFRESH_AFTER_MS) startRefresh(() => router.refresh());
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);

  const chooseTab = (id: string) => {
    setTab(id);
    setQuery("");
    listTop.current?.scrollIntoView({ block: "start" });
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] text-slate-950">
      <header className="sticky top-0 z-20 bg-[#070a12] px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.6)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image src="/cellshop-logo.svg" alt="Regtech Cell Shop" width={1439} height={418} priority unoptimized className="h-7 w-auto" />
            <span className="rounded-full bg-[#22d3ee] px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.14em] text-[#070a12]">Atacado</span>
          </div>
          <button
            type="button"
            onClick={() => startRefresh(() => router.refresh())}
            disabled={refreshing}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-semibold text-white transition-colors hover:border-[#22d3ee] hover:text-[#22d3ee] disabled:opacity-60"
          >
            <svg aria-hidden viewBox="0 0 24 24" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M20 12a8 8 0 1 1-2.34-5.66M20 4v4h-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {refreshing ? "Atualizando…" : "Atualizar"}
          </button>
        </div>

        <div className="mx-auto mt-3 max-w-2xl">
          <label className="relative block">
            <span className="sr-only">Buscar produto</span>
            <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto"
              className="h-12 w-full rounded-xl border border-white/10 bg-white/10 pl-11 pr-11 text-base text-white placeholder:text-slate-400 focus:border-[#22d3ee] focus:outline-none focus:ring-2 focus:ring-[#22d3ee]/30 [&::-webkit-search-cancel-button]:hidden"
            />
            {searching && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-300 hover:text-white"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </label>
        </div>

        <nav aria-label="Categorias" className="-mx-4 mt-3 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max max-w-none gap-2 sm:max-w-2xl">
            {[{ id: ALL, name: "Todos", count: total }, ...sections.map((s) => ({ id: s.id, name: s.name, count: s.items.length }))].map((t) => {
              const active = !searching && tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseTab(t.id)}
                  aria-pressed={active}
                  className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors ${
                    active ? "bg-white text-[#070a12]" : "bg-white/10 text-slate-200 hover:bg-white/15"
                  }`}
                >
                  {t.name}
                  <span className={`text-xs tabular-nums ${active ? "text-slate-500" : "text-slate-400"}`}>{t.count}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main ref={listTop} className="mx-auto max-w-2xl scroll-mt-48 px-3 pb-10 pt-4">
        {searching && (
          <p className="mb-3 px-1 text-sm text-slate-600" aria-live="polite">
            {found === 0 ? `Nada encontrado para “${query.trim()}”.` : `${found} ${found === 1 ? "produto" : "produtos"} para “${query.trim()}”`}
          </p>
        )}

        {shown.map((section) => (
          <section key={section.id} className="mb-5" aria-labelledby={`cat-${section.id}`}>
            <h2 id={`cat-${section.id}`} className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
              {section.name}
            </h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              {section.items.map((item) => (
                <PriceRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))}

        {!searching && total === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600">Nenhum produto com preço de atacado cadastrado ainda.</p>
        )}

        <footer className="mt-6 space-y-1.5 px-1 text-center text-xs leading-5 text-slate-500">
          <p>Preços de atacado atualizados {updatedLabel}.</p>
          <p>Uso interno da Regtech Cell Shop. Não repasse este link.</p>
          <p>Para abrir como app: no navegador, toque em Compartilhar (iPhone) ou ⋮ (Android) → “Adicionar à tela inicial”.</p>
        </footer>
      </main>
    </div>
  );
}

function PriceRow({ item }: { item: PriceItem }) {
  const single = item.lines.length === 1 ? item.lines[0] : null;
  return (
    <li className="flex gap-3 p-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f3f5f8]">
        {item.photo && (
          <Image src={getPublicImageUrl(item.photo)} alt="" fill sizes="64px" className="object-contain p-1.5 mix-blend-multiply" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {item.brand && <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-slate-500">{item.brand}</p>}
            <p className="text-[0.9375rem] font-semibold leading-5 text-slate-950">{item.name}</p>
          </div>
          {single && <p className="shrink-0 text-lg font-bold tabular-nums text-slate-950">{formatBRL(single.price)}</p>}
        </div>
        {single?.label && <p className="mt-0.5 text-xs text-slate-500">{single.label}</p>}
        {!single && (
          <dl className="mt-1.5 space-y-1">
            {item.lines.map((line, i) => (
              <div key={`${line.label}-${i}`} className="flex items-baseline justify-between gap-3">
                <dt className="min-w-0 text-sm text-slate-600">{line.label}</dt>
                <dd className="shrink-0 text-base font-bold tabular-nums text-slate-950">{formatBRL(line.price)}</dd>
              </div>
            ))}
          </dl>
        )}
        {item.note && <p className="mt-1 text-xs font-medium text-amber-700">{item.note}</p>}
      </div>
    </li>
  );
}
