"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  cleanupHeroVideoUploads,
  finalizeHeroVideoUploads,
  prepareHeroVideoUploads,
} from "./actions";
import {
  HOME_MEDIA_BUCKET,
  MAX_HERO_VIDEO_SIZE_BYTES,
  type HeroVideoViewport,
} from "@/lib/supabase/storage";

const VIDEO_FIELDS: Array<{
  viewport: HeroVideoViewport;
  inputName: string;
  label: string;
  hint: string;
}> = [
  {
    viewport: "desktop",
    inputName: "desktop_video",
    label: "Vídeo Desktop",
    hint: "Recomendado: 1920 × 1080 (16:9)",
  },
  {
    viewport: "tablet",
    inputName: "tablet_video",
    label: "Vídeo Tablet",
    hint: "Recomendado: 1600 × 1000 (16:10)",
  },
  {
    viewport: "mobile",
    inputName: "mobile_video",
    label: "Vídeo Mobile",
    hint: "Recomendado: 1080 × 1440 (3:4)",
  },
];

export default function HeroVideoUploadForm() {
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setError("");
    setStatus("");

    const form = new FormData(event.currentTarget);
    const files = {} as Record<HeroVideoViewport, File>;

    for (const field of VIDEO_FIELDS) {
      const value = form.get(field.inputName);
      if (!(value instanceof File) || value.size === 0) {
        setError(`Selecione o ${field.label.toLowerCase()}.`);
        return;
      }
      if (value.type !== "video/mp4") {
        setError(`${field.label}: use um arquivo MP4.`);
        return;
      }
      if (value.size > MAX_HERO_VIDEO_SIZE_BYTES) {
        setError(`${field.label}: o arquivo deve ter no máximo 15 MB.`);
        return;
      }
      files[field.viewport] = value;
    }

    setBusy(true);
    let preparedPaths: string[] = [];

    try {
      setStatus("Preparando envio seguro...");
      const prepared = await prepareHeroVideoUploads();
      if (!prepared.ok) {
        throw new Error("Não foi possível preparar o upload.");
      }

      preparedPaths = Object.values(prepared.uploads).map((item) => item.path);
      const supabase = createClient();

      for (const field of VIDEO_FIELDS) {
        setStatus(`Enviando ${field.label.toLowerCase()}...`);
        const target = prepared.uploads[field.viewport];
        const { error: uploadError } = await supabase.storage
          .from(HOME_MEDIA_BUCKET)
          .uploadToSignedUrl(target.path, target.token, files[field.viewport], {
            contentType: "video/mp4",
          });

        if (uploadError) {
          throw new Error(`Falha ao enviar ${field.label.toLowerCase()}.`);
        }
      }

      setStatus("Ativando vídeos no Hero...");
      const paths = {
        desktop: prepared.uploads.desktop.path,
        tablet: prepared.uploads.tablet.path,
        mobile: prepared.uploads.mobile.path,
      };
      const finalized = await finalizeHeroVideoUploads(paths);

      if (!finalized.ok) {
        throw new Error("Os vídeos foram enviados, mas não foi possível ativar o Hero.");
      }

      setStatus("Hero em vídeo atualizado com sucesso.");
      window.location.href = "/admin/hero?saved=video";
    } catch (err) {
      if (preparedPaths.length) {
        await cleanupHeroVideoUploads(preparedPaths);
      }
      setError(err instanceof Error ? err.message : "Não foi possível enviar os vídeos.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {VIDEO_FIELDS.map((field) => (
        <label className="admin-file" key={field.viewport}>
          <span>{field.label}</span>
          <small>{field.hint} · MP4 · até 15 MB</small>
          <input
            name={field.inputName}
            type="file"
            accept="video/mp4"
            required
            disabled={busy}
          />
        </label>
      ))}

      {error && <p className="admin-alert error">{error}</p>}
      {status && <p className="admin-alert success">{status}</p>}

      <button type="submit" className="admin-primary-button" disabled={busy}>
        {busy ? "Enviando..." : "Enviar e usar vídeos no Hero"}
      </button>
    </form>
  );
}
