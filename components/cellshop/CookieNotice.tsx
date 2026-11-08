"use client";

import { useEffect, useState } from "react";

const KEY = "regtech-cookies-ok";

/**
 * Aviso de privacidade (LGPD) na primeira visita. O site não usa cookies de
 * propaganda: só o necessário para funcionar (como o carrinho) e a contagem
 * anônima de visitas. Some depois do "Entendi" e não volta.
 */
export default function CookieNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- o armazenamento só existe no navegador, depois da página abrir.
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {
      // Sem armazenamento (modo anônimo etc.): não mostra para não repetir a cada página.
    }
  }, []);

  if (!show) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de privacidade"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[55] mr-[4.5rem] rounded-2xl border border-white/10 bg-[#0d1322]/95 p-4 text-white shadow-[0_18px_40px_-16px_rgba(0,0,0,0.6)] backdrop-blur sm:inset-x-auto sm:left-5 sm:mr-0 sm:max-w-sm [@media(hover:hover)_and_(pointer:fine)]:mr-0"
    >
      <p className="text-sm leading-6 text-slate-300">
        Usamos só o necessário para o site funcionar, como guardar o seu carrinho, e contamos as visitas de forma anônima. Nada de propaganda nem dados pessoais.
      </p>
      <button
        type="button"
        onClick={() => {
          try {
            window.localStorage.setItem(KEY, "1");
          } catch {
            // segue
          }
          setShow(false);
        }}
        className="mt-3 inline-flex min-h-10 items-center rounded-xl bg-white px-5 text-sm font-semibold text-[#070a12] transition-colors hover:bg-[#22d3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22d3ee]"
      >
        Entendi
      </button>
    </div>
  );
}
