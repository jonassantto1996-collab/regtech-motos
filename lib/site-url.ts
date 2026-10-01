export const OFFICIAL_SITE_URL = "https://regtechmotors.com.br";

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || OFFICIAL_SITE_URL).replace(/\/+$/, "");
}
