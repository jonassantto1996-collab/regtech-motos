"use client";

import Image from "next/image";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import { addItem, buildCartMessage, cartTotals, parseStoredCart, removeItem, setQty, type CartItem, type CartTotals, type NewCartItem } from "@/lib/cellshop/cart";
import { cardPlan, formatBRL, MAX_INSTALLMENTS, type PriceMode } from "@/lib/cellshop/pricing";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { formatPhone } from "@/lib/cellshop/cart-recovery";
import { forgetCartContact, markCartCheckedOut, syncCart } from "@/app/cellshop/cart-actions";
import { getDevice, getTrafficSource } from "@/components/analytics/SiteTracker";
import { trackStoreEvent } from "@/components/cellshop/CellshopTracker";

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

/** Lê/grava no aparelho sem quebrar quando o armazenamento não está disponível. */
function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLocal(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Ignora: sem armazenamento, o carrinho vale só nesta visita.
  }
}

/** Identificador aleatório do carrinho (não identifica a pessoa). */
function cartToken(key: string): string {
  const saved = readLocal(key);
  if (saved && /^[a-z0-9]{24,64}$/.test(saved)) return saved;
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  writeLocal(key, token);
  return token;
}

type SavedContact = { name: string; whatsapp: string };

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
  hidePrices = false,
}: {
  children: ReactNode;
  mode: PriceMode;
  whatsapp: string;
  baseUrl: string;
  /** Começo dos endereços da loja ("" no domínio próprio, "/cellshop" no das motos). */
  base: string;
  resellerName: string | null;
  /** Chave "Preços no site" desligada: o carrinho mostra "Consulte o valor" (também em itens antigos). */
  hidePrices?: boolean;
}) {
  const storageKey = `regtech-cellshop-carrinho-${mode}`;
  const [stored, setItems] = useState<CartItem[]>([]);
  const items = useMemo(() => (hidePrices ? stored.map((i) => ({ ...i, price: null })) : stored), [stored, hidePrices]);
  const [loaded, setLoaded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [installments, setInstallments] = useState(1);
  const triggerRef = useRef<HTMLElement | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tokenKey = `${storageKey}-id`;
  const syncKey = `${storageKey}-sync`;
  const contactKey = `${storageKey}-contato`;
  const [contact, setContact] = useState<SavedContact | null>(null);

  // Lê o carrinho guardado (depois de abrir a página, para não dar diferença com o servidor).
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- o armazenamento só existe no navegador, depois da página abrir.
      setItems(parseStoredCart(window.localStorage.getItem(storageKey)));
      const saved = JSON.parse(window.localStorage.getItem(contactKey) ?? "null") as SavedContact | null;
      if (saved && typeof saved.name === "string" && typeof saved.whatsapp === "string") setContact(saved);
    } catch {
      // Sem acesso ao armazenamento (modo anônimo etc.): carrinho só desta visita.
    }
    setLoaded(true);
  }, [storageKey, contactKey]);

  // Cópia do carrinho para a loja (Carrinhos parados no painel): só ids e quantidades,
  // e só quando o carrinho muda. Sem contato, a cópia é anônima.
  useEffect(() => {
    if (!loaded) return;
    const signature = JSON.stringify(items.map((i) => [i.productId, i.variantId, i.qty]));
    const last = readLocal(syncKey);
    if (last === signature || (last === null && items.length === 0)) return;
    const timer = window.setTimeout(() => {
      const token = cartToken(tokenKey);
      syncCart({
        token,
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
        dev: getDevice(),
        src: getTrafficSource(),
      })
        .then((result) => {
          if (!result.ok) return;
          writeLocal(syncKey, items.length ? signature : null);
          if (!items.length) {
            // Carrinho vazio: a cópia e o contato saem do painel.
            writeLocal(contactKey, null);
            setContact(null);
          }
        })
        .catch(() => {});
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [items, loaded, syncKey, tokenKey, contactKey]);

  const saveContact = useCallback(
    async (name: string, whatsapp: string, consent: boolean) => {
      const token = cartToken(tokenKey);
      const result = await syncCart({
        token,
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, qty: i.qty })),
        dev: getDevice(),
        src: getTrafficSource(),
        contact: { name, whatsapp, consent },
      });
      if (result.ok) {
        const saved = { name: name.replace(/\s+/g, " ").trim(), whatsapp: whatsapp.replace(/\D/g, "").replace(/^55(?=\d{10,11}$)/, "") };
        writeLocal(contactKey, JSON.stringify(saved));
        writeLocal(syncKey, JSON.stringify(items.map((i) => [i.productId, i.variantId, i.qty])));
        setContact(saved);
      }
      return result;
    },
    [items, tokenKey, contactKey, syncKey],
  );

  const removeContact = useCallback(() => {
    const token = readLocal(tokenKey);
    if (token) forgetCartContact(token).catch(() => {});
    writeLocal(contactKey, null);
    setContact(null);
  }, [tokenKey, contactKey]);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(stored));
    } catch {
      // Ignora: o carrinho continua funcionando nesta visita.
    }
  }, [stored, loaded, storageKey]);

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
      trackStoreEvent("add_to_cart");
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
                {!wholesale && (
                  <CartContactBox contact={contact} isOpen={isOpen} onSave={saveContact} onRemove={removeContact} />
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
                  onClick={() => {
                    const token = readLocal(tokenKey);
                    if (token) markCartCheckedOut(token).catch(() => {});
                  }}
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

const CONTACT_ERRORS: Record<string, string> = {
  name: "Escreva o seu nome.",
  whatsapp: "Confira o WhatsApp com DDD. Ex.: (94) 99999-9999.",
  consent: "Marque a autorização para a loja poder te chamar.",
  rate_limited: "Muitas tentativas. Tente de novo em alguns minutos.",
  server_error: "Não foi possível salvar agora. Tente de novo.",
};

/**
 * Contato opcional no carrinho: com a autorização marcada, a loja pode chamar o
 * cliente no WhatsApp se o pedido ficar parado. Dá para tirar a qualquer momento.
 */
function CartContactBox({
  contact,
  isOpen,
  onSave,
  onRemove,
}: {
  contact: SavedContact | null;
  isOpen: boolean;
  onSave: (name: string, whatsapp: string, consent: boolean) => Promise<{ ok: boolean; error?: string }>;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const tab = isOpen ? 0 : -1;

  if (contact) {
    return (
      <p className="mb-3 flex items-start justify-between gap-3 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs leading-5 text-emerald-900">
        <span>
          <strong className="font-semibold">Contato salvo.</strong> A loja pode te chamar no {formatPhone(contact.whatsapp)} sobre este pedido.
        </span>
        <button type="button" tabIndex={tab} onClick={onRemove} className="shrink-0 font-semibold underline underline-offset-2 hover:text-emerald-700">
          Remover
        </button>
      </p>
    );
  }

  if (!expanded) {
    return (
      <button
        type="button"
        tabIndex={tab}
        onClick={() => setExpanded(true)}
        className="mb-3 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-xs leading-5 text-slate-700 transition-colors hover:border-[#0a6cff] hover:text-slate-950"
      >
        <span>
          <strong className="font-semibold text-slate-950">Quer ajuda com o pedido?</strong> Deixe o seu WhatsApp e a loja te chama.
        </span>
        <span aria-hidden className="text-base text-[#0a5cff]">+</span>
      </button>
    );
  }

  return (
    <form
      className="mb-3 rounded-xl border border-slate-200 p-3.5"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSaving(true);
        setError(null);
        const result = await onSave(String(form.get("name") ?? ""), String(form.get("whatsapp") ?? ""), form.get("consent") === "on").catch(() => ({ ok: false, error: "server_error" }));
        setSaving(false);
        if (!result.ok) setError(CONTACT_ERRORS[result.error ?? "server_error"] ?? CONTACT_ERRORS.server_error);
      }}
    >
      <p className="text-xs font-semibold text-slate-950">Deixe o seu contato (opcional)</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-600">
          Nome
          <input name="name" tabIndex={tab} autoComplete="given-name" maxLength={80} required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-950 focus:border-[#0a6cff] focus:outline-none focus:ring-2 focus:ring-[#0a6cff]/20" />
        </label>
        <label className="text-xs text-slate-600">
          WhatsApp
          <input name="whatsapp" tabIndex={tab} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="(94) 99999-9999" maxLength={20} required className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-950 focus:border-[#0a6cff] focus:outline-none focus:ring-2 focus:ring-[#0a6cff]/20" />
        </label>
      </div>
      <label className="mt-2.5 flex items-start gap-2 text-[0.6875rem] leading-4 text-slate-600">
        <input name="consent" type="checkbox" tabIndex={tab} required className="mt-0.5 h-4 w-4 shrink-0 accent-[#0a5cff]" />
        <span>Autorizo a Regtech Cell Shop a me chamar no WhatsApp sobre este pedido. Os dados não são usados para mais nada e posso remover quando quiser.</span>
      </label>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
      <div className="mt-2.5 flex items-center justify-end gap-3">
        <button type="button" tabIndex={tab} onClick={() => setExpanded(false)} className="text-xs font-semibold text-slate-500 hover:text-slate-950">
          Agora não
        </button>
        <button type="submit" tabIndex={tab} disabled={saving} className="inline-flex min-h-9 items-center rounded-lg bg-[#070a12] px-4 text-xs font-semibold text-white hover:bg-[#151b2b] disabled:opacity-60">
          {saving ? "Salvando…" : "Salvar contato"}
        </button>
      </div>
    </form>
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
