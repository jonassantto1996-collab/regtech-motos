/**
 * Monta o link wa.me para abrir uma conversa com o WhatsApp oficial
 * da Regtech Motors, com a mensagem do produto já preenchida.
 *
 * O número é público/comercial e fica versionado com o projeto para evitar
 * que um ambiente antigo redirecione leads para um número de teste.
 */
const REGTECH_MOTORS_WHATSAPP = "5594992086088";

export function buildWhatsappLink(params: {
  leadName: string;
  brand: string;
  model: string;
}): string {
  const message = [
    `Olá! Meu nome é ${params.leadName}.`,
    `Tive interesse no modelo ${params.brand} ${params.model} e gostaria de saber mais informações sobre esse produto.`,
    "Aguardo o atendimento. Obrigado!",
  ].join("\n\n");

  return `https://wa.me/${REGTECH_MOTORS_WHATSAPP}?text=${encodeURIComponent(message)}`;
}
