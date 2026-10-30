import Image from "next/image";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import {
  deleteStoreProductImage,
  moveStoreProductImage,
  updateStoreImageAltText,
} from "../media-actions";
import { StoreImageUploader } from "./StoreImageUploader";

export type StoreImage = {
  id: string;
  storage_path: string;
  display_order: number;
  alt_text: string | null;
};

export function StoreImagesManager({
  productId,
  images,
  errorMessage,
}: {
  productId: string;
  images: StoreImage[];
  errorMessage?: string | null;
}) {
  return (
    <article className="panel product-editor-panel" id="fotos">
      <div className="product-images-manager">
        <div className="product-images-heading">
          <div>
            <span>FOTOS DO PRODUTO</span>
            <h2>Fotos</h2>
            <p>A primeira foto é a principal e aparece na vitrine. Sugestão: produto inteiro, detalhes e verso.</p>
          </div>
          <span className="status-badge active">{images.length} fotos</span>
        </div>

        {errorMessage && <p className="admin-alert error" role="alert">{errorMessage}</p>}

        <StoreImageUploader productId={productId} />

        {images.length === 0 ? (
          <div className="product-images-empty">
            <strong>Nenhuma foto cadastrada</strong>
            <span>Sem foto, o produto aparece na loja com um espaço reservado.</span>
          </div>
        ) : (
          <div className="product-image-grid">
            {images.map((image, index) => (
              <article className={"product-image-card " + (index === 0 ? "is-main" : "")} key={image.id}>
                <div className="product-image-preview">
                  <Image
                    src={getPublicImageUrl(image.storage_path)}
                    alt={image.alt_text ?? ""}
                    fill
                    sizes="(max-width: 800px) 100vw, 240px"
                    className="product-image-preview-media"
                  />
                  {index === 0 && <span className="product-image-main-badge">Principal</span>}
                  <span className="product-image-order">#{index + 1}</span>
                </div>
                <div className="product-image-card-body">
                  <div className="product-image-reorder">
                    <form action={moveStoreProductImage.bind(null, image.id, productId, "up")}>
                      <button type="submit" disabled={index === 0} className="product-image-icon-button" aria-label="Mover foto para antes" title="Mover para antes">←</button>
                    </form>
                    <form action={moveStoreProductImage.bind(null, image.id, productId, "down")}>
                      <button type="submit" disabled={index === images.length - 1} className="product-image-icon-button" aria-label="Mover foto para depois" title="Mover para depois">→</button>
                    </form>
                    <form action={deleteStoreProductImage.bind(null, image.id, productId)}>
                      <button type="submit" className="product-image-remove-button">Remover</button>
                    </form>
                  </div>
                  <form action={updateStoreImageAltText.bind(null, image.id, productId)} className="product-image-alt-form">
                    <label>
                      <span>Descrição da foto</span>
                      <input type="text" name="alt_text" maxLength={200} defaultValue={image.alt_text ?? ""} placeholder="Ex: Galaxy A17 preto, vista do verso" className="admin-control" />
                    </label>
                    <button type="submit" className="admin-secondary-button">Salvar</button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
