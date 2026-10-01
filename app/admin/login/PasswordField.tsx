"use client";

import { useState } from "react";

export function PasswordField({ id, name, autoComplete = "current-password", label = "Senha" }: { id: string; name: string; autoComplete?: string; label?: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input id={id} name={name} type={visible ? "text" : "password"} autoComplete={autoComplete} required />
        <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Ocultar senha" : "Mostrar senha"} aria-pressed={visible}>
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </div>
  );
}
