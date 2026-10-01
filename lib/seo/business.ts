import { getSiteUrl } from "@/lib/site-url";

export const REGTECH_MOTORS = {
  name: "Regtech Motors",
  telephone: "+55 94 99208-6088",
  whatsapp: "https://wa.me/5594992086088",
  instagram: "https://www.instagram.com/regtechmotors",
  streetAddress: "Av. dos Estados, 216",
  addressLocality: "Tucumã",
  addressRegion: "PA",
  postalCode: "68385-000",
  addressCountry: "BR",
  mapUrl: "https://share.google/w3YVKQjCmlahD7YR8",
} as const;

export function getBusinessJsonLd() {
  const siteUrl = getSiteUrl();
  const businessId = `${siteUrl}/#motorcycle-dealer`;
  const websiteId = `${siteUrl}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MotorcycleDealer",
        "@id": businessId,
        name: REGTECH_MOTORS.name,
        description:
          "Loja de motos elétricas e a combustão em Tucumã, Pará, com catálogo online e atendimento direto pelo WhatsApp.",
        url: siteUrl,
        logo: `${siteUrl}/logo-regtech-motors.png`,
        image: `${siteUrl}/logo-regtech-motors.png`,
        telephone: REGTECH_MOTORS.telephone,
        currenciesAccepted: "BRL",
        address: {
          "@type": "PostalAddress",
          streetAddress: REGTECH_MOTORS.streetAddress,
          addressLocality: REGTECH_MOTORS.addressLocality,
          addressRegion: REGTECH_MOTORS.addressRegion,
          postalCode: REGTECH_MOTORS.postalCode,
          addressCountry: REGTECH_MOTORS.addressCountry,
        },
        areaServed: {
          "@type": "City",
          name: "Tucumã",
          containedInPlace: {
            "@type": "State",
            name: "Pará",
          },
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: REGTECH_MOTORS.telephone,
          url: REGTECH_MOTORS.whatsapp,
          availableLanguage: "pt-BR",
        },
        sameAs: [REGTECH_MOTORS.instagram],
        hasMap: REGTECH_MOTORS.mapUrl,
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl,
        name: REGTECH_MOTORS.name,
        inLanguage: "pt-BR",
        publisher: { "@id": businessId },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteUrl}/products?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}
