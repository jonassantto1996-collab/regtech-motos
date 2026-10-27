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

/** De onde veio a visita (primeira página da visita). */
export const TRAFFIC_SOURCES = ["instagram", "facebook", "google", "anuncio", "direto", "outros"] as const;

export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

export const TRAFFIC_SOURCE_LABELS: Record<TrafficSource | "sem_info", string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  google: "Google",
  anuncio: "Anúncios",
  direto: "Link direto ou WhatsApp",
  outros: "Outros sites",
  sem_info: "Sem registro (antes da atualização)",
};

/** Aparelho usado na visita. */
export const DEVICES = ["celular", "tablet", "computador"] as const;

export type Device = (typeof DEVICES)[number];

export const DEVICE_LABELS: Record<Device | "sem_info", string> = {
  celular: "Celular",
  tablet: "Tablet",
  computador: "Computador",
  sem_info: "Sem registro (antes da atualização)",
};
