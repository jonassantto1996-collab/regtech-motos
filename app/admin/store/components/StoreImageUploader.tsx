"use client";

import { useRef, useState, useTransition } from "react";
import { uploadStoreProductImages } from "../media-actions";

const MAX_SIDE = 2000;
const MAX_FILES_PER_SEND = 6;

/**
 * Reduz a foto no próprio navegador antes de enviar (até 2000 px, JPEG).
 * Fotos de celular chegam com 4–8 MB; assim viram ~300 KB, o envio não
 * passa do limite da hospedagem e a loja carrega rápido.
 * Fundo transparente (PNG do fabricante) vira branco.
 */
export async function shrink(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) return file;
  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

export function StoreImageUploader({ productId }: { productId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSend() {
    const files = Array.from(inputRef.current?.files ?? []);
    if (files.length === 0) {
      setStatus("Escolha pelo menos uma foto.");
      return;
    }
    if (files.length > MAX_FILES_PER_SEND) {
      setStatus(`Envie até ${MAX_FILES_PER_SEND} fotos por vez.`);
      return;
    }
    setStatus("Preparando as fotos…");
    const formData = new FormData();
    try {
      for (const file of files) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
          setStatus("Use fotos em JPEG, PNG ou WebP.");
          return;
        }
        formData.append("files", await shrink(file));
      }
    } catch {
      setStatus("Não foi possível ler uma das fotos. Tente outra.");
      return;
    }
    setStatus("Enviando…");
    startTransition(async () => {
      await uploadStoreProductImages(productId, formData);
    });
  }

  return (
    <div className="product-image-upload">
      <label className="product-image-dropzone">
        <span className="product-image-upload-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M4 17.5V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Z" stroke="currentColor" strokeWidth="1.7" />
            <path d="m7 16 3.2-3.2 2.4 2.4 1.7-1.7L18 17M15.8 8.2h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <strong>Selecionar fotos</strong>
        <small>JPEG, PNG ou WebP · até {MAX_FILES_PER_SEND} por vez · a foto é ajustada automaticamente</small>
        <input
          ref={inputRef}
          type="file"
          name="files"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={() => setStatus(null)}
        />
      </label>
      <button
        type="button"
        onClick={handleSend}
        disabled={pending}
        className="admin-primary-button product-image-upload-button"
      >
        {pending ? "Enviando…" : "Enviar fotos"}
      </button>
      {status && <p className="store-upload-status" role="status">{status}</p>}
    </div>
  );
}
