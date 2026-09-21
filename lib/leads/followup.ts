import type { LeadStatus } from "./types";

function normalizeDestinationNumber(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  if (digits.length >= 12 && digits.length <= 15) return digits;
  return null;
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0] || "cliente";
}

export function buildLeadFollowupMessage(params: {
  fullName: string;
  productName: string;
  status: LeadStatus;
}): string {
  const name = firstName(params.fullName);
  const product = params.productName.trim() || "modelo consultado";

  const messages: Record<LeadStatus, string> = {
    NOVO:
      `Olá, ${name}! Aqui é da Regtech Motors. Recebemos seu interesse na ${product}. Posso te passar mais informações e verificar a disponibilidade para você?`,
    EM_ATENDIMENTO:
      `Olá, ${name}! Aqui é da Regtech Motors. Estou dando continuidade ao seu atendimento sobre a ${product}. Ficou alguma dúvida ou posso te ajudar com disponibilidade e condições?`,
    INTERESSADO:
      `Olá, ${name}! Aqui é da Regtech Motors. Passando para retomar seu interesse na ${product}. Se ainda fizer sentido para você, posso verificar a disponibilidade e te ajudar a continuar o atendimento.`,
    VENDA_REALIZADA:
      `Olá, ${name}! Aqui é da Regtech Motors. Parabéns pela conquista da sua ${product}! 🎉 Esperamos que você aproveite muito essa nova experiência com a mobilidade elétrica. Se precisar de qualquer orientação, suporte ou tiver alguma dúvida, pode contar com a nossa equipe.`,
    NAO_CONVERTIDO:
      `Olá, ${name}! Aqui é da Regtech Motors. Você chegou a consultar a ${product}. Se ainda tiver interesse em uma moto elétrica, posso te mostrar as opções disponíveis e tirar suas dúvidas.`,
  };

  return messages[params.status];
}

export function buildLeadFollowupWhatsappLink(params: {
  whatsapp: string;
  fullName: string;
  productName: string;
  status: LeadStatus;
}): string | null {
  const destination = normalizeDestinationNumber(params.whatsapp);
  if (!destination) return null;
  const message = buildLeadFollowupMessage(params);
  return `https://wa.me/${destination}?text=${encodeURIComponent(message)}`;
}
