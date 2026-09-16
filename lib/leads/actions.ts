"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  normalizeAndValidateName,
  normalizeAndValidateWhatsapp,
} from "./validation";
import { buildWhatsappLink } from "./whatsapp";

export type CreateLeadInput = {
  fullName: string;
  whatsapp: string;
  productId: string;
};

export type CreateLeadResult =
  | { success: true; whatsappUrl: string }
  | { success: true; whatsappUrl: null; message: string }
  | { success: false; error: string };

// Rate limiting básico (Seção 13): sem Redis/serviço externo disponível no
// projeto, uso o próprio Postgres como estado. Antes de inserir, confere se
// já existe um lead recente com o mesmo WhatsApp normalizado. Isso não cria
// uma regra de unicidade (Seção 7 continua respeitada — a mesma pessoa pode
// criar outro lead depois da janela passar, inclusive para outro produto),
// só evita clique duplo e um bot disparando muitos envios seguidos. Precisa
// de service_role porque a RLS pública não permite SELECT em leads.
const RATE_LIMIT_WINDOW_SECONDS = 60;

export async function createLead(
  input: CreateLeadInput
): Promise<CreateLeadResult> {
  // 1. Validar nome no servidor.
  const nameResult = normalizeAndValidateName(input.fullName);
  if (!nameResult.valid) {
    return { success: false, error: nameResult.error };
  }

  // 2. Validar WhatsApp no servidor.
  const whatsappResult = normalizeAndValidateWhatsapp(input.whatsapp);
  if (!whatsappResult.valid) {
    return { success: false, error: whatsappResult.error };
  }

  if (!input.productId) {
    return { success: false, error: "Produto inválido." };
  }

  const admin = createAdminClient();
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000
  ).toISOString();

  const { count: recentCount, error: rateLimitError } = await admin
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("whatsapp", whatsappResult.value)
    .gte("created_at", windowStart);

  if (rateLimitError) {
    console.error("[leads] erro ao checar rate limit:", rateLimitError);
    return {
      success: false,
      error: "Não foi possível processar sua solicitação. Tente novamente.",
    };
  }

  if ((recentCount ?? 0) > 0) {
    return {
      success: false,
      error: "Aguarde um momento antes de enviar novamente.",
    };
  }

  // 3. Confirmar que o produto ainda está ativo.
  // 4. Obter os dados atuais necessários do produto.
  // Client de anon key: a RLS já restringe products a is_active = true por
  // conta própria — o filtro explícito aqui é intencional (clareza + defesa
  // em profundidade), não uma dependência de que a RLS sozinha baste.
  const supabase = await createClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, brand, model, slug, price")
    .eq("id", input.productId)
    .eq("is_active", true)
    .maybeSingle();

  if (productError) {
    console.error("[leads] erro ao confirmar produto:", productError);
    return {
      success: false,
      error: "Não foi possível confirmar o produto. Tente novamente.",
    };
  }

  if (!product) {
    // Cobre tanto produto inexistente quanto inativo — não confia no fato
    // de o produto estar (ou não) visível no catálogo no momento do clique.
    return {
      success: false,
      error: "Este produto não está mais disponível.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const productUrl = siteUrl ? `${siteUrl}/products/${product.slug}` : null;

  // 5. Montar o registro do lead. Nome e preço são snapshots — não dependem
  // de JOIN futuro com products para reconstrução histórica (Seção 15).
  const leadRecord = {
    full_name: nameResult.value,
    whatsapp: whatsappResult.value,
    product_id: product.id,
    product_name_snapshot: `${product.brand} ${product.model}`,
    price_snapshot: Number(product.price),
    product_url: productUrl,
    status: "NOVO" as const,
    source: "catalogo",
  };

  // 6. GRAVAR O LEAD NO SUPABASE. Client de anon key — a RLS já permite
  // INSERT público restrito a status = 'NOVO' (confirmado via pg_policies).
  const { error: insertError } = await supabase
    .from("leads")
    .insert(leadRecord);

  if (insertError) {
    console.error("[leads] erro ao criar lead:", insertError);
    return {
      success: false,
      error: "Não foi possível registrar seu interesse. Tente novamente.",
    };
  }

  // 7. Só agora, com a gravação já confirmada: gerar a mensagem e devolver
  // o link para o client abrir o WhatsApp. WhatsApp nunca abre antes deste
  // ponto — se o insert acima tivesse falhado, a função já teria retornado.
  const whatsappUrl = buildWhatsappLink({
    leadName: nameResult.value,
    brand: product.brand,
    model: product.model,
  });

  if (!whatsappUrl) {
    // O lead FOI salvo com sucesso — isso não é uma falha de criação, só a
    // configuração do WhatsApp que está pendente. Não é um "sucesso falso"
    // nem um erro: é avisado como o que realmente é.
    return {
      success: true,
      whatsappUrl: null,
      message:
        "Seu interesse foi registrado! Nossa equipe entrará em contato em breve.",
    };
  }

  return { success: true, whatsappUrl };
}
