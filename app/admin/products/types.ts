export type Product = {
  id: string;
  brand: string;
  model: string;
  slug: string;
  sku: string | null;
  category: string;
  description: string;
  price: number;
  availability: string;
  warranty: string;
  pickup_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export const PRODUCT_ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Preencha todos os campos obrigatórios.",
  invalid_price: "Informe um preço válido (número maior ou igual a zero).",
  invalid_slug: "O slug informado não é válido depois de normalizado.",
  duplicate_slug: "Já existe um produto com esse slug. Escolha outro.",
  duplicate_sku: "Já existe um produto com esse SKU. Escolha outro.",
  not_found: "Produto não encontrado.",
  server_error: "Não foi possível salvar. Tente novamente.",
};
