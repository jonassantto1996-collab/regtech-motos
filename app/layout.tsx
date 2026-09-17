import type { Metadata } from "next";
import "./globals.css";

// metadataBase é usado pelo Next.js para resolver URLs absolutas de Open
// Graph/Twitter e do sitemap/robots. Só é definido se a variável de
// ambiente NEXT_PUBLIC_SITE_URL existir — nunca com um domínio inventado.
// Enquanto a variável não for configurada na Vercel, o Next.js usa um
// fallback próprio (a URL do deploy atual) e emite um aviso no build,
// o que é esperado e inofensivo até a variável ser adicionada.
export const metadata: Metadata = {
  title: "Regtech Motors",
  description: "Projeto Regtech Motors — Vértice Digital",
  ...(process.env.NEXT_PUBLIC_SITE_URL
    ? { metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL) }
    : {}),
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
