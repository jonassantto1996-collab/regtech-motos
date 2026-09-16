import type { CSSProperties } from "react";
import type { ProductImage } from "./types";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import {
  uploadProductImage,
  deleteProductImage,
  setMainProductImage,
  moveImageUp,
  moveImageDown,
  updateImageAltText,
} from "./[id]/images/actions";

type ProductImagesManagerProps = {
  productId: string;
  images: ProductImage[];
  errorMessage?: string | null;
};

export function ProductImagesManager({
  productId,
  images,
  errorMessage,
}: ProductImagesManagerProps) {
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);

  return (
    <section style={{ maxWidth: 480, marginTop: "2rem" }}>
      <h2 style={sectionHeading}>Imagens</h2>

      {errorMessage && (
        <p role="alert" style={{ color: "#c0392b", marginBottom: "1rem" }}>
          {errorMessage}
        </p>
      )}

      <form
        action={uploadProductImage.bind(null, productId)}
        style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}
      >
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          required
          style={{ flex: 1 }}
        />
        <button type="submit" style={secondaryButtonStyle}>
          Enviar imagem
        </button>
      </form>

      {sorted.length === 0 && (
        <p style={{ color: "#666" }}>Nenhuma imagem cadastrada ainda.</p>
      )}

      {sorted.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sorted.map((image, index) => (
            <li
              key={image.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 4,
                padding: "0.75rem",
                marginBottom: "0.75rem",
                display: "flex",
                gap: "0.75rem",
              }}
            >
              <img
                src={getPublicImageUrl(image.storage_path)}
                alt={image.alt_text ?? ""}
                style={{
                  width: 96,
                  height: 96,
                  objectFit: "cover",
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  {image.is_main ? (
                    <strong style={{ color: "#15803d" }}>Principal</strong>
                  ) : (
                    <form
                      action={setMainProductImage.bind(
                        null,
                        image.id,
                        productId
                      )}
                    >
                      <button type="submit" style={linkButtonStyle}>
                        Tornar principal
                      </button>
                    </form>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    marginBottom: "0.4rem",
                  }}
                >
                  <form
                    action={moveImageUp.bind(null, image.id, productId)}
                  >
                    <button
                      type="submit"
                      disabled={index === 0}
                      style={linkButtonStyle}
                    >
                      ▲ Subir
                    </button>
                  </form>
                  <form
                    action={moveImageDown.bind(null, image.id, productId)}
                  >
                    <button
                      type="submit"
                      disabled={index === sorted.length - 1}
                      style={linkButtonStyle}
                    >
                      ▼ Descer
                    </button>
                  </form>
                  <form
                    action={deleteProductImage.bind(
                      null,
                      image.id,
                      productId
                    )}
                  >
                    <button type="submit" style={linkButtonStyle}>
                      Remover
                    </button>
                  </form>
                </div>

                <form
                  action={updateImageAltText.bind(
                    null,
                    image.id,
                    productId
                  )}
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  <input
                    type="text"
                    name="alt_text"
                    defaultValue={image.alt_text ?? ""}
                    placeholder="Texto alternativo (opcional)"
                    style={{
                      flex: 1,
                      padding: "0.35rem",
                      fontFamily: "inherit",
                      fontSize: "0.9rem",
                    }}
                  />
                  <button type="submit" style={secondaryButtonStyle}>
                    Salvar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const secondaryButtonStyle: CSSProperties = {
  padding: "0.4rem 0.9rem",
  whiteSpace: "nowrap",
};

const linkButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  padding: 0,
  font: "inherit",
  fontSize: "0.9rem",
  textDecoration: "underline",
};

const sectionHeading: CSSProperties = {
  fontSize: "1.1rem",
  marginTop: "2rem",
  marginBottom: "1rem",
  borderTop: "1px solid #ddd",
  paddingTop: "1rem",
};
