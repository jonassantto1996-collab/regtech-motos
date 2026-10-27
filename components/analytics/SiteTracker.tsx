"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import type { Device, TrackSource, TrafficSource } from "@/lib/analytics/sources";

/**
 * Contagem anônima de visitas e de cliques no WhatsApp.
 * Sem cookies e sem dados pessoais: só a página, de onde a visita veio, o tipo
 * de aparelho e um número aleatório que vale enquanto a aba estiver aberta.
 */
const SESSION_KEY = "rtm_sid";
const ORIGIN_KEY = "rtm_src";

/** De onde a visita veio: decidido na primeira página e mantido na visita toda. */
function detectTrafficSource(): TrafficSource {
  const params = new URLSearchParams(window.location.search);
  const utmSource = (params.get("utm_source") ?? "").toLowerCase();
  const utmMedium = (params.get("utm_medium") ?? "").toLowerCase();
  if (params.has("gclid") || /cpc|ppc|paid|ads|anuncio/.test(utmMedium)) return "anuncio";
  if (utmSource.includes("instagram") || utmSource === "ig") return "instagram";
  if (utmSource.includes("facebook") || utmSource === "fb") return "facebook";
  if (utmSource.includes("google")) return "google";
  if (utmSource.includes("whatsapp")) return "direto";
  if (utmSource) return "outros";

  // Navegador interno dos apps (o link aberto dentro do Instagram/Facebook).
  const ua = navigator.userAgent;
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";

  let host = "";
  try {
    host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : "";
  } catch {
    host = "";
  }
  if (!host || host === window.location.hostname) return "direto";
  if (host.includes("instagram.")) return "instagram";
  if (host.includes("facebook.") || host === "fb.com" || host.endsWith(".fb.com")) return "facebook";
  if (host.includes("google.") || host.includes("bing.") || host.includes("yahoo.")) return "google";
  if (host.includes("whatsapp.") || host === "wa.me") return "direto";
  return "outros";
}

function getTrafficSource(): TrafficSource {
  try {
    const saved = window.sessionStorage.getItem(ORIGIN_KEY) as TrafficSource | null;
    if (saved) return saved;
    const detected = detectTrafficSource();
    window.sessionStorage.setItem(ORIGIN_KEY, detected);
    return detected;
  } catch {
    return detectTrafficSource();
  }
}

function getDevice(): Device {
  const ua = navigator.userAgent;
  const iPadOS = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  if (iPadOS || /iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return "tablet";
  if (/Mobi|iPhone|iPod|Android/i.test(ua)) return "celular";
  return "computador";
}

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
    send({ type: "page_view", path: pathname, sid: getSessionId(), src: getTrafficSource(), dev: getDevice() });
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
