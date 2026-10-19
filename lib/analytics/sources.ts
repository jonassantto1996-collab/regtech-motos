/** De onde veio o clique no WhatsApp (usado no site e na página Resultados do painel). */
export const TRACK_SOURCES = ["produto", "flutuante", "rodape", "home", "loja", "outros"] as const;

export type TrackSource = (typeof TRACK_SOURCES)[number];

export const TRACK_SOURCE_LABELS: Record<TrackSource, string> = {
  produto: "Página da moto",
  flutuante: "Botão flutuante",
  rodape: "Rodapé",
  home: "Página inicial",
  loja: "Página da loja",
  outros: "Outros",
};
