"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Telas de entrada e cadastro da Área do Lojista (com ou sem o prefixo /cellshop). */
export function isResellerLoginPath(pathname: string): boolean {
  return /\/lojista(\/cadastro)?\/?$/.test(pathname);
}

/**
 * Na tela de entrada do lojista (antes de entrar), o site fica "isolado": sem
 * links para a vitrine de varejo. Fora dela, mostra o conteúdo normal.
 */
export function OutsideResellerLogin({
  loggedIn,
  children,
  onLogin = null,
}: {
  loggedIn: boolean;
  children: ReactNode;
  /** O que aparece no lugar, na tela de entrada (opcional). */
  onLogin?: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  return <>{!loggedIn && isResellerLoginPath(pathname) ? onLogin : children}</>;
}
