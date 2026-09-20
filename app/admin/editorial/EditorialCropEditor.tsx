"use client";

import Image from "next/image";
import { useEffect, useState, type ChangeEvent } from "react";

type EditorialCropEditorProps = {
  imageSrc: string;
  altText: string;
  initialX: number;
  initialY: number;
  resolutionLabel: string;
};

export function EditorialCropEditor({
  imageSrc,
  altText,
  initialX,
  initialY,
  resolutionLabel,
}: EditorialCropEditorProps) {
  const [positionX, setPositionX] = useState(initialX);
  const [positionY, setPositionY] = useState(initialY);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setLocalPreview(file ? URL.createObjectURL(file) : null);
  }

  const previewSrc = localPreview ?? imageSrc;

  return (
    <div className="editorial-media-editor">
      <div className="editorial-preview">
        <Image
          src={previewSrc}
          alt={altText}
          fill
          quality={95}
          unoptimized={Boolean(localPreview)}
          className="object-cover"
          style={{ objectPosition: `${positionX}% ${positionY}%` }}
          sizes="(max-width: 900px) 100vw, 44vw"
        />
        <span
          className="editorial-focus-point"
          style={{ left: `${positionX}%`, top: `${positionY}%` }}
          aria-hidden
        />
        <div className="editorial-resolution">
          {localPreview ? "Prévia da nova imagem" : resolutionLabel}
        </div>
      </div>

      <label className="admin-file editorial-file">
        <span>Substituir imagem</span>
        <input
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
        />
        <small>JPEG, PNG ou WebP · até 15 MB · qualquer resolução · 4K é recomendado quando disponível.</small>
      </label>

      <div className="editorial-crop-controls">
        <div className="editorial-crop-heading">
          <div>
            <strong>Enquadramento ao vivo</strong>
            <span>Ajuste o ponto de foco antes de salvar.</span>
          </div>
          <span className="editorial-crop-value">{positionX}% · {positionY}%</span>
        </div>

        <label className="admin-field">
          Enquadramento horizontal
          <input
            className="editorial-range"
            name="image_position_x"
            type="range"
            min="0"
            max="100"
            step="1"
            value={positionX}
            onChange={(event) => setPositionX(Number(event.target.value))}
          />
          <small>0% esquerda · 50% centro · 100% direita</small>
        </label>

        <label className="admin-field">
          Enquadramento vertical
          <input
            className="editorial-range"
            name="image_position_y"
            type="range"
            min="0"
            max="100"
            step="1"
            value={positionY}
            onChange={(event) => setPositionY(Number(event.target.value))}
          />
          <small>0% topo · 50% centro · 100% base</small>
        </label>
      </div>
    </div>
  );
}
