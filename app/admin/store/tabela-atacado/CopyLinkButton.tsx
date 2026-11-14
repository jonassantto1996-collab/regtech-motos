"use client";

import { useState } from "react";

/** Copia o link da tabela para colar no WhatsApp do vendedor. */
export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="admin-primary-button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(link);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2500);
        } catch {
          window.prompt("Copie o link:", link);
        }
      }}
    >
      {copied ? "Link copiado ✓" : "Copiar link"}
    </button>
  );
}
