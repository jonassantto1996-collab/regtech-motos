"use client";

import { useState } from "react";
import { importNfeFile } from "./actions";

export function NfeUploadForm({ errorMessage }: { errorMessage?: string | null }) {
  const [fileName, setFileName] = useState("");

  return (
    <form action={importNfeFile} className="nfe-upload-form">
      <label className={"nfe-dropzone " + (fileName ? "has-file" : "")}>
        <input
          className="nfe-file-input"
          name="invoice"
          type="file"
          accept=".xml,.pdf,text/xml,application/xml,application/pdf"
          required
          onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? "")}
        />

        <span className="nfe-upload-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M7.5 3.75h6.25L18 8v12.25H7.5a2 2 0 0 1-2-2V5.75a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M13.5 3.75V8h4.25M12 16V10.5m0 0-2.25 2.25M12 10.5l2.25 2.25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>

        <strong>{fileName ? "Arquivo pronto para leitura" : "Selecionar NF-e em XML ou PDF"}</strong>
        <span className="nfe-file-name" aria-live="polite">
          {fileName || "XML até 2 MB · PDF até 10 MB"}
        </span>
        <span className="nfe-file-button">{fileName ? "Trocar arquivo" : "Escolher arquivo"}</span>
      </label>

      <div className="nfe-safety-note">
        <span className="nfe-safety-mark" aria-hidden="true">✓</span>
        <div>
          <strong>Conferência obrigatória antes da entrada</strong>
          <span>Nenhum estoque é alterado apenas pelo upload. XML é a fonte preferencial; PDFs só avançam quando a leitura dos itens é segura.</span>
        </div>
      </div>

      {errorMessage && <p className="admin-alert error" role="alert">{errorMessage}</p>}

      <button className="admin-primary-button nfe-read-button" type="submit" disabled={!fileName}>
        Ler nota fiscal
      </button>
    </form>
  );
}
