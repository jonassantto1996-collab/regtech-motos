/**
 * Convite para guardar o pedido (Regtech Cell Shop).
 *
 * Quem deixa o WhatsApp, com autorização, recebe o valor e as condições e tem o
 * pedido reservado por 24h. O convite fica no carrinho e aparece uma única vez
 * fora dele: no computador quando o mouse sai pelo topo da página, no celular
 * quando a pessoa sai do app/aba e volta. Nunca aparece sem itens, com o contato
 * já salvo, no atacado ou depois de enviar o pedido pelo WhatsApp.
 */
import { RESERVE_HOURS } from "./cart-recovery.ts";

/** Tempo mínimo fora da página para contar como "saiu e voltou". */
export const AWAY_MIN_MS = 3000;

export const OFFER = {
  title: `Receba o valor e reserve por ${RESERVE_HOURS}h`,
  text: `Deixe o seu WhatsApp: a loja te passa o valor e as condições e guarda o seu pedido por ${RESERVE_HOURS}h.`,
  promptTitle: "Quer garantir o seu pedido?",
  consent: `Autorizo a Regtech Cell Shop a me chamar no WhatsApp sobre este pedido (valor, condições e reserva de ${RESERVE_HOURS}h). Os dados não são usados para mais nada e posso remover quando quiser.`,
} as const;

/** Texto depois de salvar: "A loja vai te chamar no (94) 9…". */
export function savedText(phone: string): string {
  return `A loja vai te chamar no ${phone} com o valor, e o seu pedido fica reservado por ${RESERVE_HOURS}h.`;
}

export type SavePromptState = {
  itemCount: number;
  hasContact: boolean;
  wholesale: boolean;
  cartOpen: boolean;
  /** Já apareceu para este carrinho ou o pedido já foi enviado. */
  done: boolean;
};

/** Pode mostrar o convite fora do carrinho agora? */
export function canOfferSave(s: SavePromptState): boolean {
  return s.itemCount > 0 && !s.hasContact && !s.wholesale && !s.cartOpen && !s.done;
}

/** Mouse saiu pelo topo da janela (computador). */
export function isExitIntent(e: { clientY: number; relatedTarget: unknown }): boolean {
  return e.relatedTarget === null && e.clientY <= 0;
}

/** Saiu da aba/app e voltou depois de um tempo (celular). */
export function cameBack(hiddenAt: number, now: number): boolean {
  return hiddenAt > 0 && now - hiddenAt >= AWAY_MIN_MS;
}
