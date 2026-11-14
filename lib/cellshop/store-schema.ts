/**
 * Dados da Regtech Cell Shop no formato que o Google lê (loja com endereço físico
 * em Tucumã). Endereço, telefone e horário precisam bater com o perfil da loja no Google.
 */
import { CELLSHOP, CELLSHOP_URL } from "./config";
import { CELLSHOP_HOURS } from "./seo";

export const CELLSHOP_INSTAGRAM = "https://www.instagram.com/regtechcellshop";

/** Dados da loja para o Google (loja de eletrônicos com endereço físico em Tucumã). */
export function storeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ElectronicsStore",
    "@id": `${CELLSHOP_URL}/#loja`,
    name: CELLSHOP.name,
    alternateName: "RegTech CellShop",
    description: "Loja de celulares, iPhone, tablets, smartwatches, caixas de som JBL, Starlink e acessórios em Tucumã, Pará.",
    url: `${CELLSHOP_URL}/`,
    image: `${CELLSHOP_URL}/og-cellshop.png`,
    telephone: CELLSHOP.telephone,
    currenciesAccepted: "BRL",
    address: {
      "@type": "PostalAddress",
      streetAddress: CELLSHOP.streetAddress,
      addressLocality: CELLSHOP.addressLocality,
      addressRegion: CELLSHOP.addressRegion,
      postalCode: CELLSHOP.postalCode,
      addressCountry: "BR",
    },
    hasMap: CELLSHOP.mapUrl,
    areaServed: { "@type": "City", name: "Tucumã" },
    openingHoursSpecification: CELLSHOP_HOURS.filter((h) => h.opens).map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    sameAs: [CELLSHOP_INSTAGRAM],
  };
}
