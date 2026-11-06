"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Liga a escolha da versão (bloco de compra) à galeria de fotos da página do
 * produto: escolheu "Rosa", a galeria vai para a foto rosa.
 */
type VariantColorState = { color: string | null; setColor: (color: string | null) => void };

const VariantColorContext = createContext<VariantColorState | null>(null);

export function VariantColorProvider({ initialColor, children }: { initialColor: string | null; children: ReactNode }) {
  const [color, setColor] = useState<string | null>(initialColor);
  const value = useMemo(() => ({ color, setColor }), [color]);
  return <VariantColorContext.Provider value={value}>{children}</VariantColorContext.Provider>;
}

export function useVariantColor(): VariantColorState | null {
  return useContext(VariantColorContext);
}
