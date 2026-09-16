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

export type ProductColor = {
  id: string;
  product_id: string;
  color: string;
  created_at: string;
};

export type ProductSpec = {
  id: string;
  product_id: string;
  spec_key: string;
  spec_value: string;
  created_at: string;
  updated_at: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  storage_path: string;
  display_order: number;
  is_main: boolean;
  alt_text: string | null;
  created_at: string;
};

export const PRODUCT_ERROR_MESSAGES: Record<string, string> = {
  missing_fields: "Preencha todos os campos obrigatórios.",
  invalid_price: "Informe um preço válido (número maior ou igual a zero).",
  invalid_slug: "O slug informado não é válido depois de normalizado.",
  duplicate_slug: "Já existe um produto com esse slug. Escolha outro.",
  duplicate_sku: "Já existe um produto com esse SKU. Escolha outro.",
  not_found: "Produto não encontrado.",
  empty_color: "A cor não pode ficar vazia.",
  duplicate_color: "Há cores repetidas na lista. Remova a duplicata antes de salvar.",
  invalid_colors: "Não foi possível processar a lista de cores.",
  empty_spec_key: "O nome da especificação não pode ficar vazio.",
  empty_spec_value: "O valor da especificação não pode ficar vazio.",
  duplicate_spec_key:
    "Há especificações com o mesmo nome na lista. Remova a duplicata antes de salvar.",
  invalid_specs: "Não foi possível processar a lista de especificações.",
  sync_failed:
    "O produto foi salvo, mas houve um erro ao sincronizar cores ou especificações. Confira a lista e tente salvar de novo.",
  server_error: "Não foi possível salvar. Tente novamente.",
  missing_file: "Selecione um arquivo de imagem para enviar.",
  invalid_image:
    "Formato ou tamanho de imagem não permitido. Use JPEG, PNG ou WebP de até 5MB.",
  image_not_found: "Imagem não encontrada ou não pertence a este produto.",
  upload_failed: "Não foi possível enviar a imagem. Tente novamente.",
  delete_failed: "Não foi possível remover a imagem. Tente novamente.",
  reorder_failed:
    "Não foi possível alterar a ordem das imagens. Tente novamente.",
  alt_text_update_failed:
    "Não foi possível salvar o texto alternativo. Tente novamente.",
  main_image_switch_failed:
    "Não foi possível trocar a imagem principal. A imagem anterior foi mantida.",
  main_image_switch_critical:
    "Falha crítica ao trocar a imagem principal — nem a antiga nem a nova ficaram marcadas como principal. Contate o suporte técnico informando o ID do produto.",
  main_image_promotion_failed:
    "A imagem foi removida, mas não foi possível definir outra como principal automaticamente. Defina uma imagem principal manualmente.",
};
