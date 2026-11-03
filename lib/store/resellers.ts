/**
 * Área do Lojista: validação do cadastro (sem dependência de servidor).
 * Lojista = loja que compra no atacado. O cadastro fica "em análise" até a
 * Regtech aprovar no painel; só então o site mostra os preços de atacado.
 */
export type ResellerStatus = "pending" | "approved" | "rejected" | "blocked";

export const RESELLER_STATUS_LABEL: Record<ResellerStatus, string> = {
  pending: "Em análise",
  approved: "Aprovado",
  rejected: "Recusado",
  blocked: "Bloqueado",
};

export type ResellerSignup = {
  contact_name: string;
  store_name: string;
  document: string;
  whatsapp: string;
  city: string;
  email: string;
  password: string;
};

export type ResellerSignupResult = { ok: true; data: ResellerSignup } | { ok: false; error: string };

export const RESELLER_ERRORS: Record<string, string> = {
  missing_fields: "Preencha todos os campos.",
  invalid_document: "CNPJ ou CPF inválido. Confira os números.",
  invalid_whatsapp: "WhatsApp inválido. Use DDD + número, ex.: (94) 99999-9999.",
  invalid_email: "E-mail inválido.",
  weak_password: "A senha precisa ter pelo menos 8 caracteres.",
  field_too_long: "Algum campo passou do tamanho permitido.",
  email_taken: "Este e-mail já tem cadastro. Entre com a sua senha.",
  document_taken: "Este CNPJ/CPF já tem cadastro. Fale com a loja se precisar de ajuda.",
  rate_limited: "Muitas tentativas. Espere alguns minutos e tente de novo.",
  invalid_credentials: "E-mail ou senha inválidos.",
  not_reseller: "Esta conta não é de lojista. Faça o cadastro para acessar.",
  server_error: "Não foi possível concluir agora. Tente de novo.",
};

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function allSame(digits: string) {
  return /^(\d)\1+$/.test(digits);
}

export function isValidCpf(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11 || allSame(d)) return false;
  for (const size of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < size; i += 1) sum += Number(d[i]) * (size + 1 - i);
    const check = ((sum * 10) % 11) % 10;
    if (check !== Number(d[size])) return false;
  }
  return true;
}

export function isValidCnpj(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 14 || allSame(d)) return false;
  const calc = (size: number) => {
    const weights = size === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(d[i]) * w, 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

/** WhatsApp brasileiro: DDD + número (10 ou 11 dígitos), aceita com 55 na frente. */
export function normalizeWhatsapp(value: string): string | null {
  let d = onlyDigits(value);
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  if (d.length !== 10 && d.length !== 11) return null;
  if (Number(d.slice(0, 2)) < 11) return null;
  return d;
}

export function formatDocument(value: string): string {
  const d = onlyDigits(value);
  if (d.length === 14) return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  if (d.length === 11) return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return value;
}

export function formatWhatsapp(value: string): string {
  const d = onlyDigits(value);
  if (d.length === 11) return d.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  if (d.length === 10) return d.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  return value;
}

export function parseResellerSignup(formData: FormData): ResellerSignupResult {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const contact_name = text("contact_name");
  const store_name = text("store_name");
  const documentRaw = text("document");
  const whatsappRaw = text("whatsapp");
  const city = text("city");
  const email = text("email").toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!contact_name || !store_name || !documentRaw || !whatsappRaw || !city || !email || !password) {
    return { ok: false, error: "missing_fields" };
  }
  if (contact_name.length > 120 || store_name.length > 120 || city.length > 120 || email.length > 254 || password.length > 72) {
    return { ok: false, error: "field_too_long" };
  }
  if (contact_name.length < 2 || store_name.length < 2 || city.length < 2) return { ok: false, error: "missing_fields" };

  const document = onlyDigits(documentRaw);
  if (!(isValidCnpj(document) || isValidCpf(document))) return { ok: false, error: "invalid_document" };

  const whatsapp = normalizeWhatsapp(whatsappRaw);
  if (!whatsapp) return { ok: false, error: "invalid_whatsapp" };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "invalid_email" };
  if (password.length < 8) return { ok: false, error: "weak_password" };

  return { ok: true, data: { contact_name, store_name, document, whatsapp, city, email, password } };
}

/** Senha provisória para o painel entregar ao lojista (sem letras que confundem). */
export function temporaryPassword(random: (max: number) => number): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i += 1) out += alphabet[random(alphabet.length)];
  return out;
}
