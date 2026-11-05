"use client";

import { useMemo, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import { useCart } from "@/components/cellshop/Cart";
import {
  cardCondition,
  cardPlan,
  formatBRL,
  MAX_INSTALLMENTS,
  priceLabel,
  variantPrice,
  type PriceMode,
  type PricedProduct,
} from "@/lib/cellshop/pricing";

type Variant = { id: string; name: string; price: number | string | null; wholesale_price: number | string | null; stock_quantity: number };

/**
 * Bloco de compra da página do produto: escolha da versão, preço, simulação
 * de parcelas e botão do WhatsApp com a mensagem já pronta.
 */
export default function ProductBuyBox({
  productId,
  slug,
  imagePath,
  product,
  productTitle,
  variants,
  mode,
  whatsapp,
  pageUrl,
  resellerName = null,
}: {
  productId: string;
  slug: string;
  /** Foto principal (aparece no carrinho). */
  imagePath: string | null;
  product: PricedProduct;
  productTitle: string;
  variants: Variant[];
  mode: PriceMode;
  whatsapp: string;
  pageUrl: string;
  /** Lojista aprovado: a mensagem do WhatsApp já sai como pedido de atacado. */
  resellerName?: string | null;
}) {
  const firstAvailable = variants.find((v) => v.stock_quantity > 0) ?? variants[0] ?? null;
  const [variantId, setVariantId] = useState<string | null>(firstAvailable?.id ?? null);
  const variant = variants.find((v) => v.id === variantId) ?? null;

  const price = variantPrice(product, variant, mode);
  // Simulador: tabela de tarifas da loja (1x a 18x) sobre o preço da versão escolhida.
  const card = cardCondition(product, price, mode);
  const plan = useMemo(() => (card && price !== null ? cardPlan(price) : []), [card, price]);
  const [installments, setInstallments] = useState<number>(MAX_INSTALLMENTS);
  const chosen = card ? plan[Math.min(installments, plan.length) - 1] ?? null : null;
  const soldOut = variants.length > 0 && variants.every((v) => v.stock_quantity <= 0);
  const variantSoldOut = variant ? variant.stock_quantity <= 0 : soldOut;

  const message = useMemo(() => {
    const item = variant && variants.length > 1 ? `${productTitle} (${variant.name})` : productTitle;
    if (resellerName) {
      const how = price !== null ? ` por ${formatBRL(price)} (atacado)` : "";
      return variantSoldOut
        ? `Olá! Sou da ${resellerName} (lojista). Quando chega de novo o ${item}?\n${pageUrl}`
        : `Olá! Sou da ${resellerName} (lojista) e quero comprar no atacado: ${item}${how}. Quantas unidades tem disponível?\n${pageUrl}`;
    }
    if (variantSoldOut) return `Olá! Vi o ${item} no site da Regtech Cell Shop. Quando chega de novo?\n${pageUrl}`;
    let how = "";
    if (chosen) {
      how =
        chosen.installments === 1
          ? ` no cartão em 1x de ${formatBRL(chosen.total)}`
          : ` em ${chosen.installments}x de ${formatBRL(chosen.parcel)} no cartão (total ${formatBRL(chosen.total)})`;
    } else if (price !== null) {
      how = ` por ${formatBRL(price)}`;
    }
    return `Olá! Vi o ${item} no site da Regtech Cell Shop e quero comprar${how}. Ainda tem disponível?\n${pageUrl}`;
  }, [variant, variants.length, productTitle, variantSoldOut, chosen, price, pageUrl, resellerName]);

  const href = `${whatsapp}?text=${encodeURIComponent(message)}`;
  const cart = useCart();

  function addToCart() {
    cart?.add({
      productId,
      variantId: variant?.id ?? null,
      slug,
      title: productTitle,
      variantName: variant && variants.length > 1 ? variant.name : null,
      price,
      imagePath,
    });
  }

  return (
    <div>
      <div className="mt-5">
        {price !== null ? (
          <p className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {formatBRL(price)}
            <span className="ml-2 align-middle text-sm font-medium tracking-normal text-slate-500">{priceLabel(mode)}</span>
          </p>
        ) : (
          <p className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Consulte o valor</p>
        )}
        {card && (
          <p className="mt-1.5 text-sm text-slate-600 sm:text-base">
            ou em até <strong className="font-semibold text-slate-900">{card.installments}x de {formatBRL(card.parcel)}</strong> no cartão
          </p>
        )}
      </div>

      {variants.length > 1 && (
        <div className="mt-7">
          <p id="cs-variant-label" className="text-sm font-semibold text-slate-900">Escolha a versão</p>
          <div role="group" aria-labelledby="cs-variant-label" className="mt-3 flex flex-wrap gap-2.5">
            {variants.map((v) => {
              const active = v.id === variantId;
              const out = v.stock_quantity <= 0;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={active}
                  className={`min-h-12 rounded-xl border px-4 py-2 text-left text-sm font-semibold transition-colors ${
                    active
                      ? "border-[#070a12] bg-[#070a12] text-white"
                      : "border-slate-300 bg-white text-slate-900 hover:border-[#0a6cff]"
                  } ${out ? "opacity-60" : ""}`}
                >
                  {v.name}
                  {out && <span className="ml-2 text-xs font-medium">(esgotado)</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {card && !variantSoldOut && (
        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <p id="cs-installments-label" className="text-sm font-semibold text-slate-900">Simule as parcelas no cartão</p>
          <div role="group" aria-labelledby="cs-installments-label" className="mt-3 grid grid-cols-6 gap-2">
            {plan.map(({ installments: n, parcel }) => {
              const active = n === chosen?.installments;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setInstallments(n)}
                  aria-pressed={active}
                  aria-label={`${n} parcela${n > 1 ? "s" : ""} de ${formatBRL(parcel)}`}
                  className={`min-h-11 rounded-lg border text-sm font-semibold transition-colors ${
                    active ? "border-[#0a6cff] bg-[#0a6cff] text-white" : "border-slate-300 bg-white text-slate-900 hover:border-[#0a6cff]"
                  }`}
                >
                  {n}x
                </button>
              );
            })}
          </div>
          {chosen && (
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-2xl font-bold tracking-tight text-slate-950" aria-live="polite">
                {chosen.installments}x de {formatBRL(chosen.parcel)}
              </p>
              <p className="text-sm text-slate-600">Total no cartão: <strong className="text-slate-900">{formatBRL(chosen.total)}</strong></p>
            </div>
          )}
        </div>
      )}

      <div className="mt-7">
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          data-track-source="produto"
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#15803d] px-6 py-4 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#166534] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] focus-visible:ring-offset-2 active:translate-y-0"
        >
          <WhatsAppIcon className="h-5 w-5 shrink-0" />
          {variantSoldOut ? "Avise-me pelo WhatsApp" : "Comprar pelo WhatsApp"}
        </a>
        {cart && !variantSoldOut && (
          <button
            type="button"
            onClick={addToCart}
            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-[#070a12] bg-white px-6 text-sm font-semibold uppercase tracking-[0.14em] text-[#070a12] transition-colors hover:bg-[#070a12] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a6cff] focus-visible:ring-offset-2"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path d="M5 8h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 8Z" strokeLinejoin="round" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
            </svg>
            Adicionar ao carrinho
          </button>
        )}
        <p className="mt-3 text-sm text-slate-500">
          A mensagem já vai pronta com o produto{variants.length > 1 ? ", a versão" : ""}{card && !variantSoldOut ? " e a parcela escolhida" : ""}.
        </p>
      </div>
    </div>
  );
}
