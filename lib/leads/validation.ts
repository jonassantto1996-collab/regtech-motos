/**
 * Regras de validação decididas dentro do espaço já aprovado pela Etapa 4.6
 * (a spec pedia "regra razoável e consistente", sem definir os números
 * exatos). Documentado no relatório final.
 */

export type ValidationResult =
  | { valid: true; value: string }
  | { valid: false; error: string };

/**
 * Nome: remove espaços supérfluos, exige ao menos duas palavras (nome +
 * sobrenome) com pelo menos 2 caracteres cada, tamanho total entre 3 e 120.
 */
export function normalizeAndValidateName(raw: string): ValidationResult {
  const trimmed = raw.trim().replace(/\s+/g, " ");

  if (trimmed.length < 3) {
    return { valid: false, error: "Informe seu nome completo." };
  }
  if (trimmed.length > 120) {
    return { valid: false, error: "Nome muito longo." };
  }

  const words = trimmed.split(" ").filter((word) => word.length >= 2);
  if (words.length < 2) {
    return { valid: false, error: "Informe nome e sobrenome." };
  }

  return { valid: true, value: trimmed };
}

/**
 * WhatsApp: mantém só dígitos e exige entre 10 e 13 dígitos — cobre formatos
 * locais (DDD + número, com ou sem o 9º dígito) e com código do país (55).
 * Não valida DDD específico nem exige DDI, para não recusar números
 * legítimos por uma regra rígida demais que o negócio não definiu.
 */
export function normalizeAndValidateWhatsapp(raw: string): ValidationResult {
  const digitsOnly = raw.replace(/\D/g, "");

  if (digitsOnly.length < 10 || digitsOnly.length > 13) {
    return { valid: false, error: "Informe um número de WhatsApp válido." };
  }

  return { valid: true, value: digitsOnly };
}
