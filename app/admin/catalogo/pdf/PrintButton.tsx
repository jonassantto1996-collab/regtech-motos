"use client";

/** Abre a janela de impressão do navegador ("Salvar como PDF"). */
export function PrintButton() {
  return (
    <button type="button" className="cat-print-button" onClick={() => window.print()}>
      Salvar em PDF
    </button>
  );
}
