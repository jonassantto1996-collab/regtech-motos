"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import { addItem, buildCartMessage, cartTotals, parseStoredCart, removeItem, setQty, type CartItem, type CartTotals, type NewCartItem } from "@/lib/cellshop/cart";
import { cardPlan, formatBRL, MAX_INSTALLMENTS, type PriceMode } from "@/lib/cellshop/pricing";
import { getPublicImageUrl } from "@/lib/supabase/storage";

type CartContextValue = {
  items: CartItem[];
  totals: CartTotals;
  add: (item: NewCartItem, qty?: number) => void;
  open: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Carrinho da página (ou null fora da loja). */
export function useCart() {
  return useContext(CartContext);
}

function BagIcon({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9">
      <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" strokeLinejoin="round" />
      <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Carrinho da Regtech Cell Shop: guarda os itens no aparelho do cliente
 * (separado para varejo e atacado) e fecha o pedido no WhatsApp com uma
 * mensagem única. O botão do carrinho fica no topo e o painel abre pela direita.
 */
export function CartProvider({
  children,
  mode,
  whatsapp,
  baseUrl,
  base,
  resellerName,
}: {
  children: ReactNode;
  mode: PriceMode;
  whatsapp: string;
  baseUrl: string;
  /** Começo dos endereços da loja ("" no domínio próprio, "/cellshop" no das motos). */
  base: string;
  resellerName: string | null;
}) {
  const storageKey = `regtech-cellshop-carrinho-${mode}`;
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [installments, setInstallments] = useState(1);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Lê o carrinho guardado (depois de abrir a página, para não dar diferença com o servidor).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- o armazenamento só existe no navegador, depois da página abrir.
      setItems(parseStoredCart(window.localStorage.getItem(storageKey)));
    } catch {
      // Sem acesso ao armazenamento (modo anônimo etc.): carrinho só desta visita.
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Ignora: o carrinho continua funcionando nesta visita.
    }
  }, [items, loaded, storageKey]);

  const totals = useMemo(() => cartTotals(items, mode), [items, mode]);

  const open = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus?.();
  }, []);

  const add = useCallback(
    (item: NewCartItem, qty = 1) => {
      setItems((prev) => addItem(prev, item, qty));
      open();
    },
    [open],
  );

  // Painel aberto: foco no botão de fechar, Esc fecha e a página de trás não rola.
  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [isOpen, close]);

  const wholesale = mode === "wholesale";
  const plan = totals.total > 0 && !wholesale ? cardPlan(totals.total) : [];
  const chosenInstallments = Math.min(installments, MAX_INSTALLMENTS);
  const message = buildCartMessage(items, { mode, baseUrl, resellerName, installments: chosenInstallments });
  const checkoutHref = `${whatsapp}?text=${encodeURIComponent(message)}`;

  const value = useMemo(() => ({ items, totals, add, open }), [items, totals, add, open]);

  return (
    <CartContext.Provider value={value}>
      {children}

      <div className={`fixed inset-0 z-[60] ${isOpen ? "" : "pointer-events-none"}`} aria-hidden={!isOpen} inert={!isOpen}>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Fechar carrinho"
          onClick={close}
          className={`absolute inset-0 bg-[#070a12]/55 transition-opacity duration-200 ${isOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="carrinho-titulo"
          className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-[-24px_0_60px_-30px_rgba(7,10,18,0.6)] transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
            <h2 id="carrinho-titulo" className="text-lg font-bold tracking-tight text-slate-950">
              Seu carrinho{totals.count > 0 ? ` (${totals.count})` : ""}
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Fechar carrinho"
              tabIndex={isOpen ? 0 : -1}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6cff]"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
              <BagIcon className="h-12 w-12 text-slate-300" />
              <p className="text-lg font-semibold text-slate-950">Seu carrinho está vazio</p>
              <p className="text-sm leading-6 text-slate-600">Escolha os produtos e feche o pedido pelo WhatsApp, tudo em uma mensagem só.</p>
              <Link
                href={`${base || "/"}#vitrine`}
                onClick={close}
                tabIndex={isOpen ? 0 : -1}
                className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-[#070a12] px-5 text-sm font-semibold text-white hover:bg-[#151b2b]"
              >
                Ver produtos
              </Link>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-4 py-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f3f5f8]">
                      {item.imagePath ? (
                        <Image src={getPublicImageUrl(item.imagePath)} alt="" fill sizes="80px" className="object-contain p-2 mix-blend-multiply" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`${base}/produto/${item.slug}`}
                        onClick={close}
                        tabIndex={isOpen ? 0 : -1}
                        className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 hover:text-[#0a5cff]"
                      >
                        {item.title}
                      </Link>
                      {item.variantName && <p className="mt-0.5 text-xs text-slate-500">{item.variantName}</p>}
                      <p className="mt-1 text-sm font-bold text-slate-950">{item.price !== null ? formatBRL(item.price) : "Consulte o valor"}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-lg border border-slate-300" role="group" aria-label={`Quantidade de ${item.title}`}>
                          <button
                            type="button"
                            tabIndex={isOpen ? 0 : -1}
                            onClick={() => setItems((prev) => setQty(prev, item.key, item.qty - 1))}
                            aria-label={item.qty === 1 ? `Tirar ${item.title} do carrinho` : `Diminuir quantidade de ${item.title}`}
                            className="inline-flex h-9 w-9 items-center justify-center text-lg text-slate-700 hover:text-slate-950"
                          >
                            −
                          </button>
                          <span className="min-w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            tabIndex={isOpen ? 0 : -1}
                            onClick={() => setItems((prev) => setQty(prev, item.key, item.qty + 1))}
                            aria-label={`Aumentar quantidade de ${item.title}`}
                            className="inline-flex h-9 w-9 items-center justify-center text-lg text-slate-700 hover:text-slate-950"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          tabIndex={isOpen ? 0 : -1}
                          onClick={() => setItems((prev) => removeItem(prev, item.key))}
                          className="text-xs font-semibold text-slate-500 underline-offset-4 hover:text-red-600 hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t border-slate-200 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-4">
                {totals.total > 0 && (
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-slate-600">Total {wholesale ? "no atacado" : "à vista"}</span>
                    <span className="text-2xl font-bold tracking-tight text-slate-950">{formatBRL(totals.total)}</span>
                  </div>
                )}
                {totals.hasUnpriced && (
                  <p className="mt-1 text-xs text-slate-500">Os itens “consulte o valor” a loja passa pelo WhatsApp.</p>
                )}
                {plan.length > 0 && (
                  <label className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-700">
                    <span>Pagamento</span>
                    <select
                      value={chosenInstallments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      tabIndex={isOpen ? 0 : -1}
                      className="min-h-10 max-w-[65%] rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-950 focus:border-[#0a6cff] focus:outline-none focus:ring-2 focus:ring-[#0a6cff]/20"
                    >
                      <option value={1}>À vista: {formatBRL(totals.total)}</option>
                      {plan.slice(1).map((p) => (
                        <option key={p.installments} value={p.installments}>
                          {p.installments}x de {formatBRL(p.parcel)} (total {formatBRL(p.total)})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <a
                  href={checkoutHref}
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={isOpen ? 0 : -1}
                  data-track-source="carrinho"
                  className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#15803d] px-6 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#166534] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] focus-visible:ring-offset-2"
                >
                  <WhatsAppIcon className="h-5 w-5 shrink-0" />
                  Finalizar pelo WhatsApp
                </a>
                <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                  <button type="button" tabIndex={isOpen ? 0 : -1} onClick={close} className="font-semibold text-[#0a5cff] underline-offset-4 hover:underline">
                    Continuar comprando
                  </button>
                  <button
                    type="button"
                    tabIndex={isOpen ? 0 : -1}
                    onClick={() => setItems([])}
                    className="text-slate-500 underline-offset-4 hover:text-red-600 hover:underline"
                  >
                    Esvaziar carrinho
                  </button>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </CartContext.Provider>
  );
}

/** Botão do carrinho no topo da loja, com a quantidade de itens. */
export function CartButton() {
  const cart = useCart();
  if (!cart) return null;
  const count = cart.totals.count;
  return (
    <button
      type="button"
      onClick={cart.open}
      aria-label={count ? `Carrinho, ${count} ${count === 1 ? "item" : "itens"}` : "Carrinho vazio"}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-[#22d3ee] hover:text-[#22d3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
    >
      <BagIcon className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#22d3ee] px-1 text-[0.6875rem] font-bold leading-5 text-[#070a12]">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
