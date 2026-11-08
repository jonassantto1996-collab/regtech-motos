"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getDevice, getSessionId, getTrafficSource, send } from "@/components/analytics/SiteTracker";
import type { StoreTrackSource } from "@/lib/analytics/sources";

/**
 * Contagem anônima da Regtech Cell Shop (igual à das motos): visitas, cliques no
 * WhatsApp e "adicionou ao carrinho". Sem cookies e sem dados pessoais.
 * Quem está logado (equipe ou lojista) não entra na conta: o painel mostra o varejo.
 */
export function trackStoreEvent(type: "add_to_cart", path: string = window.location.pathname) {
  send({ site: "cellshop", type, path, sid: getSessionId() });
}

function sourceFor(anchor: HTMLAnchorElement, pathname: string): StoreTrackSource {
  const tagged = anchor.dataset.trackSource;
  if (tagged === "carrinho" || tagged === "flutuante") return tagged;
  if (anchor.closest("footer")) return "rodape";
  if (/\/produto\//.test(pathname)) return "produto";
  if (pathname === "/" || pathname === "/cellshop") return "home";
  return "outros";
}

export default function CellshopTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    // O endereço que a pessoa vê (no domínio da loja não tem o /cellshop).
    send({ site: "cellshop", type: "page_view", path: window.location.pathname, sid: getSessionId(), src: getTrafficSource(), dev: getDevice() });
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href*="wa.me/"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const path = window.location.pathname;
      send({ site: "cellshop", type: "whatsapp_click", path, source: sourceFor(anchor, path), sid: getSessionId() });
    }
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
