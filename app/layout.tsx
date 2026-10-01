import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Regtech Motors",
  description:
    "Motos elétricas e a combustão na Regtech Motors. Conheça os modelos disponíveis no catálogo e fale com a gente pelo WhatsApp.",
  metadataBase: new URL(getSiteUrl()),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
