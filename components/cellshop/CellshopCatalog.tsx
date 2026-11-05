"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import CellshopProductCard from "@/components/cellshop/CellshopProductCard";
import type { CellshopProduct } from "@/lib/cellshop/queries";
import type { PriceMode } from "@/lib/cellshop/pricing";
import { matchesSearch } from "@/lib/cellshop/search";

type Category = { id: string; name: string; slug: string };

/**
 * Vitrine com busca instantânea: filtra enquanto o cliente digita, sem
 * recarregar a página. Digitar busca em todas as categorias; as abas mostram
 * quantos produtos de cada categoria batem com a busca (abas sem resultado
 * somem). Limpar a busca volta para "Todos". O endereço da página acompanha
 * (?q= e ?categoria=), então o link compartilhado abre do mesmo jeito.
 */
export default function CellshopCatalog({
  products,
  categories,
  mode,
  base,
  whatsapp,
  initialQuery,
  initialCategory,
}: {
  products: CellshopProduct[];
  categories: Category[];
  mode: PriceMode;
  base: string;
  whatsapp: string;
  initialQuery: string;
  initialCategory: string | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState<string | null>(initialCategory);
  const deferredQuery = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const searching = deferredQuery.trim().length > 0;

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.id, c.name])), [categories]);

  // Produtos que batem com a busca (em todas as categorias).
  const matched = useMemo(
    () => products.filter((p) => matchesSearch(p, deferredQuery, categoryName.get(p.category_id) ?? "")),
    [products, deferredQuery, categoryName],
  );

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of matched) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
    return counts;
  }, [matched]);

  const tabs = categories.filter((c) => (countByCategory.get(c.id) ?? 0) > 0);
  const active = tabs.find((c) => c.slug === categorySlug) ?? null;
  const list = active ? matched.filter((p) => p.category_id === active.id) : matched;

  // Endereço da página acompanha a busca e a aba (sem recarregar).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const url = new URL(window.location.href);
      const q = query.trim();
      if (q) url.searchParams.set("q", q);
      else url.searchParams.delete("q");
      if (active) url.searchParams.set("categoria", active.slug);
      else url.searchParams.delete("categoria");
      window.history.replaceState(window.history.state, "", url);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query, active]);

  function onType(value: string) {
    setQuery(value);
    // Digitou: procura em todas as categorias. Apagou tudo: volta para "Todos".
    setCategorySlug(null);
  }

  function clearSearch() {
    setQuery("");
    setCategorySlug(null);
    inputRef.current?.focus();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    inputRef.current?.blur();
    document.getElementById("vitrine-resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const q = deferredQuery.trim();
  const title = active ? active.name : searching ? "Resultados da busca" : "Todos os produtos";
  const summary = `${list.length} ${list.length === 1 ? "produto" : "produtos"}${q ? ` para “${q}”` : ""}${active && q ? ` em ${active.name}` : ""}`;
  const askMessage = `Olá! Procurei "${q}" no site e não achei. Vocês têm?`;

  return (
    <section id="vitrine" aria-labelledby="vitrine-titulo" className="scroll-mt-20 bg-[#f6f8fb]">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0a6cff]">Vitrine</p>
            <h2 id="vitrine-titulo" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-600" aria-live="polite" aria-atomic="true">
              {summary}
            </p>
          </div>

          <form role="search" aria-label="Buscar na loja" onSubmit={onSubmit} className="w-full lg:w-[26rem]">
            <label htmlFor="cs-search" className="sr-only">
              Buscar produto
            </label>
            <div className="relative">
              <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                id="cs-search"
                type="search"
                name="q"
                value={query}
                onChange={(e) => onType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && query) {
                    e.preventDefault();
                    clearSearch();
                  }
                }}
                autoComplete="off"
                enterKeyHint="search"
                placeholder="Buscar: iPhone, Galaxy, carregador…"
                aria-controls="vitrine-resultados"
                className="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-12 pr-12 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0a6cff] focus:ring-2 focus:ring-[#0a6cff]/20 [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6cff]"
                >
                  <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>

        {tabs.length > 0 && (
          <div role="group" aria-label="Categorias" className="-mx-4 mt-8 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
            {[{ slug: null as string | null, name: "Todos", count: matched.length }, ...tabs.map((c) => ({ slug: c.slug as string | null, name: c.name, count: countByCategory.get(c.id) ?? 0 }))].map((c) => {
              const isActive = (c.slug ?? null) === (active?.slug ?? null);
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setCategorySlug(c.slug)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6cff] focus-visible:ring-offset-2 ${
                    isActive ? "border-[#070a12] bg-[#070a12] text-white" : "border-slate-300 bg-white text-slate-800 hover:border-[#0a6cff]"
                  }`}
                >
                  {c.name}
                  <span className={`text-xs ${isActive ? "text-slate-300" : "text-slate-500"}`}>{c.count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div id="vitrine-resultados" className="scroll-mt-24">
          {list.length ? (
            <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
              {list.map((product) => (
                <CellshopProductCard
                  key={product.id}
                  product={product}
                  mode={mode}
                  base={base}
                  categoryName={active ? undefined : categoryName.get(product.category_id)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-lg font-semibold">Não achamos “{q}” no site.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Confira a escrita ou tente uma palavra mais simples (ex.: “iPhone 16”, “carregador”). Se preferir, pergunte para a loja: muita coisa chega antes de entrar no site.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 text-sm font-semibold transition-colors hover:border-[#0a6cff]"
                >
                  Ver todos os produtos
                </button>
                <a
                  href={`${whatsapp}?text=${encodeURIComponent(askMessage)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15803d] px-5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Perguntar no WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
