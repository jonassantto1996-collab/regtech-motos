/**
 * Monta o link wa.me para abrir uma conversa com o número de destino
 * configurado via NEXT_PUBLIC_WHATSAPP_NUMBER, com a mensagem já
 * preenchida. Retorna null se a variável não estiver configurada — nunca
 * usa um número fictício como fallback.
 */
export function buildWhatsappLink(params: {
  leadName: string;
  brand: string;
  model: string;
}): string | null {
  const rawNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!rawNumber) {
    return null;
  }

  const destinationNumber = rawNumber.replace(/\D/g, "");
  if (!destinationNumber) {
    return null;
  }

  const message = [
    `Olá! Meu nome é ${params.leadName}.`,
    `Tive interesse na ${params.brand} ${params.model} e gostaria de saber mais informações sobre esse produto.`,
    "Aguardo o atendimento. Obrigado!",
  ].join("\n\n");

  return `https://wa.me/${destinationNumber}?text=${encodeURIComponent(message)}`;
}
