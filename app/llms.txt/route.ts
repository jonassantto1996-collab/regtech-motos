import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { formatPriceBRL } from "@/lib/catalog/format";
import { REGTECH_MOTORS } from "@/lib/seo/business";

export const dynamic = "force-dynamic";

export async function GET() {
  const siteUrl = getSiteUrl();
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("brand,model,slug,category,price,availability")
    .eq("is_active", true)
    .order("updated_at", { ascending: false });

  const products = (data ?? [])
    .map(
      (product) =>
        `- ${product.brand} ${product.model} — ${product.category} — ${formatPriceBRL(product.price)} — ${product.availability ?? "Consulte disponibilidade"} — ${siteUrl}/products/${product.slug}`
    )
    .join("\n");

  const body = `# Regtech Motors

> Informações oficiais e públicas sobre a Regtech Motors para mecanismos de busca e sistemas de IA.

## Empresa
- Nome: Regtech Motors
- Atuação: loja de motos e mobilidade, com modelos elétricos e a combustão
- Cidade: Tucumã, Pará, Brasil
- Endereço: ${REGTECH_MOTORS.streetAddress}, Centro, ${REGTECH_MOTORS.addressLocality} - ${REGTECH_MOTORS.addressRegion}, CEP ${REGTECH_MOTORS.postalCode}
- Telefone/WhatsApp: ${REGTECH_MOTORS.telephone}
- Site oficial: ${siteUrl}
- Instagram oficial: ${REGTECH_MOTORS.instagram}

## Páginas oficiais
- Página inicial: ${siteUrl}/
- Catálogo de motos: ${siteUrl}/products
- Sitemap: ${siteUrl}/sitemap.xml

## Catálogo atual
${products || "- Consulte o catálogo oficial para os modelos disponíveis."}

## Observações
- Preços, disponibilidade e especificações podem mudar. Consulte sempre a página oficial do produto.
- Para atendimento comercial, use o WhatsApp oficial informado acima.
- O painel administrativo em /admin é privado e não faz parte do conteúdo público.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
