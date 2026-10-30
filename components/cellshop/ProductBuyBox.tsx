"use client";

import { useMemo, useState } from "react";
import { WhatsAppIcon } from "@/components/icons/SiteIcons";
import {
  cardCondition,
  formatBRL,
  installmentValue,
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
  product,
  productTitle,
  variants,
  mode,
  whatsapp,
  pageUrl,
}: {
  product: PricedProduct;
  productTitle: string;
  variants: Variant[];
  mode: PriceMode;
  whatsapp: string;
  pageUrl: string;
}) {
  const firstAvailable = variants.find((v) => v.stock_quantity > 0) ?? variants[0] ?? null;
  const [variantId, setVariantId] = useState<string | null>(firstAvailable?.id ?? null);
  const variant = variants.find((v) => v.id === variantId) ?? null;

  const price = variantPrice(product, variant, mode);
  const card = cardCondition(product, price, mode);
  const [installments, setInstallments] = useState<number>(card?.installments ?? 1);
  const chosen = card ? Math.min(installments, card.installments) : null;
  const soldOut = variants.length > 0 && variants.every((v) => v.stock_quantity <= 0);
  const variantSoldOut = variant ? variant.stock_quantity <= 0 : soldOut;

  const message = useMemo(() => {
    const item = variant && variants.length > 1 ? `${productTitle} (${variant.name})` : productTitle;
    if (variantSoldOut) return `Olá! Vi o ${item} no site da Regtech Cell Shop. Quando chega de novo?\n${pageUrl}`;
    let how = "";
    if (card && chosen) {
      how = chosen === 1 ? ` no cartão em 1x de ${formatBRL(card.total)}` : ` em ${chosen}x de ${formatBRL(installmentValue(card.total, chosen))} no cartão`;
    } else if (price !== null) {
      how = ` por ${formatBRL(price)}`;
    }
    return `Olá! Vi o ${item} no site da Regtech Cell Shop e quero comprar${how}. Ainda tem disponível?\n${pageUrl}`;
  }, [variant, variants.length, productTitle, variantSoldOut, card, chosen, price, pageUrl]);

  const href = `${whatsapp}?text=${encodeURIComponent(message)}`;

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
            ou <strong className="font-semibold text-slate-900">{card.installments}x de {formatBRL(card.parcel)}</strong> no cartão
            <span className="text-slate-500"> (total {formatBRL(card.total)})</span>
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
            {Array.from({ length: card.installments }, (_, i) => i + 1).map((n) => {
              const active = n === chosen;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => setInstallments(n)}
                  aria-pressed={active}
                  aria-label={`${n} parcela${n > 1 ? "s" : ""} de ${formatBRL(installmentValue(card.total, n))}`}
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
              <p className="text-2xl font-bold tracking-tight text-slate-950">
                {chosen}x de {formatBRL(installmentValue(card.total, chosen))}
              </p>
              <p className="text-sm text-slate-600">Total no cartão: <strong className="text-slate-900">{formatBRL(card.total)}</strong></p>
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
        <p className="mt-3 text-sm text-slate-500">
          A mensagem já vai pronta com o produto{variants.length > 1 ? ", a versão" : ""}{card && !variantSoldOut ? " e a parcela escolhida" : ""}.
        </p>
      </div>
    </div>
  );
}
