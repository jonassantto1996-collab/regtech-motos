"use client";

import { useState, useTransition } from "react";
import { resetResellerPassword } from "../lojistas/actions";

/** "Nova senha": gera uma senha provisória e mostra uma vez para mandar ao lojista. */
export function ResellerPasswordReset({ resellerId, whatsapp, storeName }: { resellerId: string; whatsapp: string; storeName: string }) {
  const [password, setPassword] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  function generate() {
    setFailed(false);
    startTransition(async () => {
      const result = await resetResellerPassword(resellerId);
      if (result.ok) setPassword(result.password);
      else setFailed(true);
    });
  }

  if (password) {
    const text = `Olá! Aqui é da Regtech Cell Shop. A nova senha da Área do Lojista (${storeName}) é: ${password}`;
    return (
      <span className="reseller-password">
        Nova senha: <code>{password}</code>
        <a className="banner-mini-button" href={`https://wa.me/55${whatsapp}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          Mandar no WhatsApp
        </a>
      </span>
    );
  }
  return (
    <span className="reseller-password">
      <button type="button" className="admin-secondary-button" onClick={generate} disabled={pending}>
        {pending ? "Gerando…" : "Gerar nova senha"}
      </button>
      {failed && <small className="batch-warn">Não foi possível gerar. Tente de novo.</small>}
    </span>
  );
}
