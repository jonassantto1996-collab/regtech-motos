"use client";

import { useRef, useState } from "react";

const shareUrl = "https://regtechmotors.com.br/cartao";
const pixKey = "94991005814";

export default function CardActions() {
  const [message, setMessage] = useState("");
  const pixInput = useRef<HTMLInputElement>(null);

  async function copyPix() {
    try {
      await navigator.clipboard.writeText(pixKey);
      setMessage("Chave Pix copiada.");
    } catch {
      pixInput.current?.focus();
      pixInput.current?.select();
      setMessage("Selecione e copie a chave Pix no campo abaixo.");
    }
  }

  async function shareCard() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Regtech | Cartão digital", text: "Catálogos e contatos da Regtech em Tucumã.", url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Link do cartão copiado. Cole na conversa para compartilhar.");
    } catch {
      setMessage("Copie o endereço desta página para compartilhar o cartão.");
    }
  }

  const button = "flex min-h-12 items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300";

  return (
    <div className="space-y-5 px-5 sm:px-8">
      <div className="grid grid-cols-2 gap-3">
        <a href="/cartao-assets/regtech-cartao.pdf" download="Regtech_Cartao_Digital.pdf" className={`${button} bg-cyan-300 text-slate-950 hover:bg-cyan-200`}>Baixar PDF</a>
        <button type="button" onClick={shareCard} className={`${button} border border-slate-600 hover:bg-slate-800`}>Compartilhar</button>
      </div>
      <section id="pix" aria-labelledby="pix-title" className="scroll-mt-6 rounded-2xl border border-slate-700 bg-[#101d38] p-5">
        <h2 id="pix-title" className="text-lg font-semibold">Chave Pix • Regtech</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <label htmlFor="pix-key" className="sr-only">Chave Pix por telefone</label>
          <input ref={pixInput} id="pix-key" readOnly value={pixKey} className="min-h-12 min-w-0 flex-1 rounded-lg border border-slate-600 bg-[#050d22] px-3 text-lg tracking-wide" />
          <button type="button" onClick={copyPix} className={`${button} bg-cyan-300 text-slate-950 hover:bg-cyan-200`}>Copiar chave</button>
        </div>
      </section>
      <p role="status" aria-live="polite" className="min-h-6 text-center text-sm text-cyan-200">{message}</p>
    </div>
  );
}
