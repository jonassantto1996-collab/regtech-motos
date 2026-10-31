"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { replaceStoreBannerImage } from "../banners/actions";
import type { BannerDevice } from "@/lib/store/banners";

/** Botão "Trocar" de uma versão (computador, tablet ou celular) de um banner. */
export function BannerReplaceImage({ bannerId, device, label }: { bannerId: string; device: BannerDevice; label: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function send(file: File) {
    setMessage(null);
    let width = 0;
    let height = 0;
    try {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      bitmap.close();
    } catch {
      setMessage("Imagem inválida.");
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    formData.set("width", String(width));
    formData.set("height", String(height));
    startTransition(async () => {
      const result = await replaceStoreBannerImage(bannerId, device, formData);
      if (!result.ok) setMessage(result.error);
      else router.refresh();
    });
  }

  return (
    <span className="banner-replace">
      <label className={`banner-mini-button ${pending ? "is-busy" : ""}`}>
        {pending ? "Enviando…" : label}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={pending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void send(file);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </label>
      {message && <small className="batch-warn" role="alert">{message}</small>}
    </span>
  );
}
