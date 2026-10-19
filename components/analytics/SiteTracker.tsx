"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { TrackSource } from "@/lib/analytics/sources";

/**
 * Contagem anônima de visitas e de cliques no WhatsApp.
 * Sem cookies e sem dados pessoais: só a página, a origem do clique e um
 * número aleatório que vale enquanto a aba estiver aberta.
 */
const SESSION_KEY = "rtm_sid";

function getSessionId(): string | null {
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID().replace(/-/g, "")
          : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function send(payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) {
      return;
    }
  } catch {
    // segue para o fetch
  }
  fetch("/api/track", {
    method: "POST",
    body,
    headers: { "content-type": "application/json" },
    keepalive: true,
  }).catch(() => {});
}

function sourceFor(anchor: HTMLAnchorElement, pathname: string): TrackSource {
  const tagged = anchor.dataset.trackSource;
  if (tagged === "flutuante") return "flutuante";
  if (anchor.closest("footer")) return "rodape";
  if (pathname.startsWith("/products/")) return "produto";
  if (pathname === "/") return "home";
  if (pathname.startsWith("/loja")) return "loja";
  return "outros";
}

export default function SiteTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;
    send({ type: "page_view", path: pathname, sid: getSessionId() });
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a[href*="wa.me/"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const path = window.location.pathname;
      send({
        type: "whatsapp_click",
        path,
        source: sourceFor(anchor, path),
        sid: getSessionId(),
      });
    }
    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  return null;
}
