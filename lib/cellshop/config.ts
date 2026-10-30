import { headers } from "next/headers";
import { REGTECH_MOTORS } from "@/lib/seo/business";

/**
 * Regtech Cell Shop — loja de tecnologia da Regtech (celulares, tablets,
 * carregadores, Bombox, Starlink e acessórios). Usa o mesmo sistema e o mesmo
 * painel da Regtech Motors, com identidade e domínio próprios.
 */
export const CELLSHOP_DOMAIN = "regtechcellshop.com.br";
export const CELLSHOP_HOSTS = new Set([CELLSHOP_DOMAIN, `www.${CELLSHOP_DOMAIN}`]);
export const CELLSHOP_URL = `https://${CELLSHOP_DOMAIN}`;
export const MOTORS_URL = "https://regtechmotors.com.br";

export const CELLSHOP = {
  name: "Regtech Cell Shop",
  // Mesmo atendimento da loja física enquanto a Cell Shop não tiver número próprio.
  whatsapp: REGTECH_MOTORS.whatsapp,
  telephone: REGTECH_MOTORS.telephone,
  // Endereço próprio da Cell Shop (a loja de motos fica no nº 216).
  streetAddress: "Av. dos Estados, 241",
  addressLocality: "Tucumã",
  addressRegion: "PA",
  postalCode: REGTECH_MOTORS.postalCode,
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Av.%20dos%20Estados%2C%20241%2C%20Centro%2C%20Tucum%C3%A3%20-%20PA",
  openingHours: REGTECH_MOTORS.openingHours,
} as const;

/** true quando a página está sendo aberta pelo domínio da Cell Shop. */
export async function isCellshopHost(): Promise<boolean> {
  const host = (await headers()).get("host")?.toLowerCase().split(":")[0] ?? "";
  return CELLSHOP_HOSTS.has(host);
}

/**
 * Prefixo dos links internos da loja: vazio no domínio próprio
 * (regtechcellshop.com.br/produto/x) e "/cellshop" nas prévias.
 */
export async function getCellshopBase(): Promise<string> {
  return (await isCellshopHost()) ? "" : "/cellshop";
}
