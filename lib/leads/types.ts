export type LeadStatus =
  | "NOVO"
  | "EM_ATENDIMENTO"
  | "INTERESSADO"
  | "VENDA_REALIZADA"
  | "NAO_CONVERTIDO";

/**
 * Mesma lista e mesma ordem do CHECK constraint da coluna `status` na
 * tabela `leads` — não inventar nem reordenar sem alterar o banco também.
 */
export const LEAD_STATUSES: LeadStatus[] = [
  "NOVO",
  "EM_ATENDIMENTO",
  "INTERESSADO",
  "VENDA_REALIZADA",
  "NAO_CONVERTIDO",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NOVO: "Novo",
  EM_ATENDIMENTO: "Em atendimento",
  INTERESSADO: "Interessado",
  VENDA_REALIZADA: "Venda realizada",
  NAO_CONVERTIDO: "Não convertido",
};

export type Lead = {
  id: string;
  full_name: string;
  whatsapp: string;
  product_id: string | null;
  product_name_snapshot: string;
  price_snapshot: number;
  product_url: string | null;
  status: LeadStatus;
  source: string | null;
  created_at: string;
  updated_at: string;
};
