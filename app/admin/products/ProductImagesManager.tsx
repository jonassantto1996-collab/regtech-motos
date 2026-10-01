import Image from "next/image";
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
    <div className="product-images-manager">
      <div className="product-images-heading">
        <div>
          <span>GALERIA DA MOTO</span>
          <h2>Imagens</h2>
          <p>Organize as fotos do catálogo e defina qual imagem será exibida como principal.</p>
        </div>
        <span className="status-badge active">{sorted.length} imagens</span>
      </div>

      {errorMessage && (
        <p className="admin-alert error" role="alert">
          {errorMessage}
        </p>
      )}

      <form
        action={uploadProductImage.bind(null, productId)}
        className="product-image-upload"
      >
        <label className="product-image-dropzone">
          <span className="product-image-upload-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 17.5V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5Z" stroke="currentColor" strokeWidth="1.7"/>
              <path d="m7 16 3.2-3.2 2.4 2.4 1.7-1.7L18 17M15.8 8.2h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <strong>Selecionar nova imagem</strong>
          <small>JPEG, PNG ou WebP · até 5 MB</small>
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp"
            required
          />
        </label>
        <button type="submit" className="admin-primary-button product-image-upload-button">
          Enviar imagem
        </button>
      </form>

      {sorted.length === 0 ? (
        <div className="product-images-empty">
          <strong>Nenhuma imagem cadastrada</strong>
          <span>Adicione a primeira foto da moto para exibi-la no catálogo.</span>
        </div>
      ) : (
        <div className="product-image-grid">
          {sorted.map((image, index) => (
            <article className={"product-image-card " + (image.is_main ? "is-main" : "")} key={image.id}>
              <div className="product-image-preview">
                <Image
                  src={getPublicImageUrl(image.storage_path)}
                  alt={image.alt_text ?? ""}
                  fill
                  sizes="(max-width: 800px) 100vw, 240px"
                  className="product-image-preview-media"
                />
                {image.is_main && <span className="product-image-main-badge">Principal</span>}
                <span className="product-image-order">#{index + 1}</span>
              </div>

              <div className="product-image-card-body">
                <div className="product-image-primary-action">
                  {image.is_main ? (
                    <span className="product-image-main-copy">Imagem principal do catálogo</span>
                  ) : (
                    <form action={setMainProductImage.bind(null, image.id, productId)}>
                      <button type="submit" className="product-image-text-button">
                        Tornar principal
                      </button>
                    </form>
                  )}
                </div>

                <div className="product-image-reorder">
                  <form action={moveImageUp.bind(null, image.id, productId)}>
                    <button
                      type="submit"
                      disabled={index === 0}
                      className="product-image-icon-button"
                      aria-label="Mover imagem para cima"
                      title="Mover para cima"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveImageDown.bind(null, image.id, productId)}>
                    <button
                      type="submit"
                      disabled={index === sorted.length - 1}
                      className="product-image-icon-button"
                      aria-label="Mover imagem para baixo"
                      title="Mover para baixo"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={deleteProductImage.bind(null, image.id, productId)}>
                    <button type="submit" className="product-image-remove-button">
                      Remover
                    </button>
                  </form>
                </div>

                <form
                  action={updateImageAltText.bind(null, image.id, productId)}
                  className="product-image-alt-form"
                >
                  <label>
                    <span>Texto alternativo</span>
                    <input
                      type="text"
                      name="alt_text"
                      defaultValue={image.alt_text ?? ""}
                      placeholder="Ex: Moto elétrica preta vista lateral"
                      className="admin-control"
                    />
                  </label>
                  <button type="submit" className="admin-secondary-button">
                    Salvar texto
                  </button>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
