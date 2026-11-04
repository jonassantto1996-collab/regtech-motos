"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { loginReseller, signupReseller, type ResellerFormResult } from "@/app/cellshop/lojista/actions";
import { RESELLER_ERRORS } from "@/lib/store/resellers";

const INPUT =
  "mt-1.5 block min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#0a6cff] focus:ring-2 focus:ring-[#0a6cff]/20";
const LABEL = "block text-sm font-semibold text-slate-800";
const BUTTON =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#00c8ff] to-[#0a5cff] px-6 text-sm font-semibold uppercase tracking-[0.12em] text-white transition hover:brightness-110 disabled:cursor-progress disabled:opacity-70";

/** Envia sem limpar os campos: se der erro, o lojista corrige só o que precisa. */
function useResellerForm(action: (formData: FormData) => Promise<ResellerFormResult>) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(RESELLER_ERRORS[result.error] ?? RESELLER_ERRORS.server_error);
    });
  }
  return { error, pending, onSubmit };
}

function PasswordInput({ id, autoComplete, hint }: { id: string; autoComplete: string; hint?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className={LABEL}>
        Senha
      </label>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={8}
          maxLength={72}
          className={`${INPUT} pr-24`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 mt-[3px] min-h-9 -translate-y-1/2 rounded-lg px-3 text-xs font-semibold uppercase tracking-[0.1em] text-[#0a5cff] hover:bg-slate-100"
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {message}
    </p>
  );
}

export function ResellerLoginForm({ footer, next }: { footer?: ReactNode; next?: string }) {
  const { error, pending, onSubmit } = useResellerForm(loginReseller);
  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
      {/* Depois de entrar, volta para o produto que o lojista abriu (ex.: link da lista do WhatsApp). */}
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="login-email" className={LABEL}>
          E-mail
        </label>
        <input id="login-email" name="email" type="email" autoComplete="email" required maxLength={254} className={INPUT} />
      </div>
      <PasswordInput id="login-password" autoComplete="current-password" />
      <FormError message={error} />
      <button type="submit" disabled={pending} className={BUTTON}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
      {footer}
    </form>
  );
}

export function ResellerSignupForm() {
  const { error, pending, onSubmit } = useResellerForm(signupReseller);
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Campo escondido contra robôs. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Site</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="store_name" className={LABEL}>
            Nome da loja
          </label>
          <input id="store_name" name="store_name" required maxLength={120} autoComplete="organization" className={INPUT} placeholder="Ex.: Cell Center Ourilândia" />
        </div>
        <div>
          <label htmlFor="document" className={LABEL}>
            CNPJ (ou CPF)
          </label>
          <input id="document" name="document" required inputMode="numeric" maxLength={18} className={INPUT} placeholder="00.000.000/0000-00" />
        </div>
        <div>
          <label htmlFor="city" className={LABEL}>
            Cidade / UF
          </label>
          <input id="city" name="city" required maxLength={120} autoComplete="address-level2" className={INPUT} placeholder="Ex.: Tucumã, PA" />
        </div>
        <div>
          <label htmlFor="contact_name" className={LABEL}>
            Seu nome
          </label>
          <input id="contact_name" name="contact_name" required maxLength={120} autoComplete="name" className={INPUT} />
        </div>
        <div>
          <label htmlFor="whatsapp" className={LABEL}>
            WhatsApp
          </label>
          <input id="whatsapp" name="whatsapp" required type="tel" inputMode="tel" maxLength={20} autoComplete="tel" className={INPUT} placeholder="(94) 99999-9999" />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="signup-email" className={LABEL}>
            E-mail (para entrar no site)
          </label>
          <input id="signup-email" name="email" type="email" required maxLength={254} autoComplete="email" className={INPUT} />
        </div>
        <div className="sm:col-span-2">
          <PasswordInput id="signup-password" autoComplete="new-password" hint="Pelo menos 8 caracteres." />
        </div>
      </div>

      <FormError message={error} />
      <button type="submit" disabled={pending} className={BUTTON}>
        {pending ? "Enviando cadastro…" : "Enviar cadastro"}
      </button>
      <p className="text-center text-xs leading-5 text-slate-500">
        A Regtech confere os dados e libera o acesso. Você recebe o aviso pelo WhatsApp.
      </p>
    </form>
  );
}
