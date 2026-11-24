// Dados estruturados (JSON-LD) da página de cada moto.
//
// O Google exige que todo "Product" traga "offers", "review" ou "aggregateRating";
// sem isso o Search Console acusa erro crítico ("Especifique offers, review ou
// aggregateRating") e a página perde o resultado de produto. Como não temos
// avaliações reais, o "Product" só sai quando há uma oferta com preço válido.
// Com o preço oculto (ou zerado), a página não leva o bloco de produto.

type MotoForJsonLd = {
  brand: string;
  model: string;
  slug: string;
  category: string;
  description: string | null;
  price: number | null;
  availability: string | null;
};

export function motoAvailabilitySchema(availability: string | null): string | undefined {
  const normalized = availability?.trim().toLowerCase() ?? "";
  if (normalized.includes("indispon")) return "https://schema.org/OutOfStock";
  if (normalized.includes("dispon")) return "https://schema.org/InStock";
  return undefined;
}

export function motoProductJsonLd(
  product: MotoForJsonLd,
  opts: { siteUrl: string; showPrices: boolean; imageUrl?: string },
): Record<string, unknown> | null {
  const price = Number(product.price);
  if (!opts.showPrices || !Number.isFinite(price) || price <= 0) return null;

  const url = `${opts.siteUrl}/products/${product.slug}`;
  const dealer = { "@id": `${opts.siteUrl}/#motorcycle-dealer` };
  const availability = motoAvailabilitySchema(product.availability);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.brand} ${product.model}`,
    ...(product.description ? { description: product.description } : {}),
    ...(opts.imageUrl ? { image: [opts.imageUrl] } : {}),
    brand: { "@type": "Brand", name: product.brand },
    category: product.category,
    url,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: price.toFixed(2),
      url,
      ...(availability ? { availability } : {}),
      seller: dealer,
    },
  };
}
