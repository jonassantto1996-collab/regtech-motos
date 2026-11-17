/**
 * Mensagem pronta dos botões gerais de WhatsApp (topo, rodapé, botão flutuante).
 *
 * Toda conversa que sai do site chega com "site da Regtech Motors" ou
 * "site da Regtech Cell Shop" escrito. Assim a loja procura essa frase no
 * WhatsApp e confere quantas pessoas realmente mandaram mensagem, para comparar
 * com os cliques do painel.
 */
export const MOTORS_SITE_PHRASE = "site da Regtech Motors";
export const CELLSHOP_SITE_PHRASE = "site da Regtech Cell Shop";

export const MOTORS_SITE_MESSAGE = `Olá! Vim pelo ${MOTORS_SITE_PHRASE} e quero mais informações.`;
export const CELLSHOP_SITE_MESSAGE = `Olá! Vim pelo ${CELLSHOP_SITE_PHRASE} e quero mais informações.`;
export const CELLSHOP_RESELLER_SITE_MESSAGE = `Olá! Sou lojista e vim pelo ${CELLSHOP_SITE_PHRASE}.`;

/** Link wa.me com a mensagem pronta. Se o link já tiver mensagem, fica como está. */
export function withWhatsappMessage(link: string, message: string): string {
  if (/[?&]text=/.test(link)) return link;
  return `${link}${link.includes("?") ? "&" : "?"}text=${encodeURIComponent(message)}`;
}
