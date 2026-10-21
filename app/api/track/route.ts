import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { TRACK_SOURCES, type TrackSource } from "@/lib/analytics/sources";

/**
 * Recebe os eventos anônimos do site (visita de página e clique no WhatsApp)
 * e grava em public.site_events. Responde sempre 204, para nunca atrapalhar
 * a navegação do cliente nem revelar detalhes de erro.
 *
 * Só grava no site oficial (VERCEL_ENV=production): prévias e testes não
 * misturam números com os da loja. Visitas de quem está logado no painel
 * também não contam.
 */
const BOT_PATTERN = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|whatsapp|telegram/i;
const SESSION_PATTERN = /^[a-z0-9]{8,40}$/;
const PRODUCT_PATH = /^\/products\/([^/]+)$/;

function noContent() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "production") return noContent();

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_PATTERN.test(userAgent)) return noContent();

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== request.nextUrl.host) return noContent();
    } catch {
      return noContent();
    }
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 2000) return noContent();
    body = JSON.parse(raw);
  } catch {
    return noContent();
  }
  if (!body || typeof body !== "object") return noContent();

  const { type, path, source, sid } = body as Record<string, unknown>;
  if (type !== "page_view" && type !== "whatsapp_click") return noContent();
  if (typeof path !== "string" || !path.startsWith("/") || path.length > 300) return noContent();
  if (path.startsWith("/admin") || path.startsWith("/api")) return noContent();

  const sessionId = typeof sid === "string" && SESSION_PATTERN.test(sid) ? sid : null;
  const trackSource: TrackSource | null =
    type === "whatsapp_click"
      ? typeof source === "string" && (TRACK_SOURCES as readonly string[]).includes(source)
        ? (source as TrackSource)
        : "outros"
      : null;

  try {
    // Quem está logado no painel (equipe da loja / Viestro) não entra na conta.
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    if (claims?.claims) return noContent();

    const admin = createAdminClient();

    let productId: string | null = null;
    const match = PRODUCT_PATH.exec(path);
    if (match) {
      let slug = match[1];
      try {
        slug = decodeURIComponent(slug);
      } catch {
        return noContent();
      }
      const { data: product } = await admin
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      productId = product?.id ?? null;
    }

    await admin.from("site_events").insert({
      event_type: type,
      path,
      product_id: productId,
      source: trackSource,
      session_id: sessionId,
    });
  } catch {
    // Silencioso: a contagem nunca pode quebrar o site.
  }

  return noContent();
}
