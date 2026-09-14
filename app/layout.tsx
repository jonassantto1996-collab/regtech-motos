import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Regtech Motos",
  description: "Projeto Regtech Motos — Vértice Digital",
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
