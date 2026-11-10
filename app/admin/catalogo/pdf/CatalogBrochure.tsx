import type { ReactNode } from "react";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { REGTECH_MOTORS } from "@/lib/seo/business";
import {
  BROCHURE_INSTALLMENTS,
  brochurePrice,
  colorSwatch,
  formatBRL,
  moneyParts,
  paginate,
  type BrochureMode,
} from "@/lib/catalog/brochure";

/** Páginas A4 do catálogo (capa + 3 motos por página). Só apresentação: os dados vêm da página. */
export type BrochureRow = {
  id: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  price: number | string;
  wholesale_price: number | string | null;
  product_images: { storage_path: string; display_order: number; is_main: boolean }[] | null;
  product_colors: { color: string; created_at: string }[] | null;
  product_specs: { spec_key: string; spec_value: string; created_at: string }[] | null;
};

function Logo({ className }: { className: string }) {
  // O arquivo do logo tem margem transparente: o recorte mostra só o desenho (igual ao site).
  return (
    <span className={`cat-logo ${className}`} role="img" aria-label="Regtech Motors">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-regtech-motors.png" alt="" />
    </span>
  );
}

function PriceBlock({ mode, row }: { mode: BrochureMode; row: BrochureRow }) {
  const price = brochurePrice(mode, row);
  if (price.kind === "consulte") {
    return (
      <>
        <p className="cat-price-label">{mode === "atacado" ? "PREÇO DE ATACADO" : "CONDIÇÃO ESPECIAL"}</p>
        <div className="cat-price-pill cat-price-pill-text">Consulte</div>
      </>
    );
  }
  const big = moneyParts(price.kind === "varejo" ? price.installment : price.price);
  return (
    <>
      {price.kind === "varejo" ? (
        <p className="cat-price-label">
          POR APENAS {BROCHURE_INSTALLMENTS}X<sup>SEM JUROS</sup>
        </p>
      ) : (
        <p className="cat-price-label">PREÇO DE ATACADO</p>
      )}
      <div className="cat-price-pill">
        <span className="cat-price-currency">R$</span>
        <span className="cat-price-reais">{big.reais}</span>
        <span className="cat-price-cents">,{big.cents}</span>
      </div>
    </>
  );
}

/** Linha de baixo (depois da ficha), como no catálogo original: "VALOR FINAL". */
function FinalLine({ mode, row }: { mode: BrochureMode; row: BrochureRow }) {
  const price = brochurePrice(mode, row);
  if (price.kind === "varejo") return <p className="cat-final">VALOR FINAL: {formatBRL(price.total)}</p>;
  if (price.kind === "atacado") return <p className="cat-final cat-final-wholesale">Preço exclusivo para lojistas</p>;
  return null;
}

function Moto({ row, mode, flip }: { row: BrochureRow; mode: BrochureMode; flip: boolean }) {
  const images = [...(row.product_images ?? [])].sort((a, b) => Number(b.is_main) - Number(a.is_main) || a.display_order - b.display_order);
  const photo = images[0] ? getPublicImageUrl(images[0].storage_path) : null;
  const specs = [...(row.product_specs ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, 7);
  const colors = [...(row.product_colors ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at)).slice(0, 8);
  return (
    <article className={`cat-moto ${flip ? "is-flip" : ""}`}>
      <div className="cat-moto-text">
        <h3>
          {row.brand} {row.model}
        </h3>
        <PriceBlock mode={mode} row={row} />
        {specs.length > 0 ? (
          <ul className="cat-specs">
            {specs.map((s) => (
              <li key={s.spec_key}>
                {s.spec_key}: {s.spec_value}
              </li>
            ))}
          </ul>
        ) : (
          <p className="cat-desc">{row.description}</p>
        )}
        <FinalLine mode={mode} row={row} />
      </div>
      <div className="cat-moto-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {photo ? <img src={photo} alt={`${row.brand} ${row.model}`} /> : <span className="cat-no-photo">Foto em breve</span>}
        {colors.length > 0 && (
          <div className="cat-colors">
            <span>CORES:</span>
            {colors.map((c) => {
              const swatch = colorSwatch(c.color);
              const background =
                swatch.colors.length > 1 ? `linear-gradient(90deg, ${swatch.colors[0]} 50%, ${swatch.colors[1]} 50%)` : swatch.colors[0];
              return <i key={c.color} title={swatch.label} style={{ background }} />;
            })}
          </div>
        )}
      </div>
    </article>
  );
}

const ICON = { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true } as const;

function FooterIcon({ children }: { children: ReactNode }) {
  return (
    <svg {...ICON}>
      <circle cx="12" cy="12" r="12" fill="#1f8bff" />
      <g fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

function Footer() {
  const phone = REGTECH_MOTORS.telephone.replace("+55 ", "(").replace(" ", ") ");
  return (
    <footer className="cat-footer">
      <div className="cat-footer-info">
        <p>
          <FooterIcon>
            <path d="M8.5 6.5h2l1 3-1.5 1a7 7 0 0 0 3.5 3.5l1-1.5 3 1v2a1.5 1.5 0 0 1-1.6 1.5A10 10 0 0 1 7 8.1 1.5 1.5 0 0 1 8.5 6.5z" />
          </FooterIcon>
          {phone}
        </p>
        <p>
          <FooterIcon>
            <path d="M12 18.5s-4.5-4.2-4.5-7.5a4.5 4.5 0 0 1 9 0c0 3.3-4.5 7.5-4.5 7.5z" />
            <circle cx="12" cy="11" r="1.6" />
          </FooterIcon>
          {REGTECH_MOTORS.streetAddress}, {REGTECH_MOTORS.addressLocality}-{REGTECH_MOTORS.addressRegion}
        </p>
      </div>
      <div className="cat-footer-info">
        <p>
          <FooterIcon>
            <rect x="7" y="7" width="10" height="10" rx="3" />
            <circle cx="12" cy="12" r="2.4" />
          </FooterIcon>
          @regtechmotors
        </p>
        <p>
          <FooterIcon>
            <circle cx="12" cy="12" r="5.5" />
            <path d="M6.5 12h11M12 6.5c1.6 1.6 1.6 9.4 0 11M12 6.5c-1.6 1.6-1.6 9.4 0 11" />
          </FooterIcon>
          regtechmotors.com.br
        </p>
      </div>
      <Logo className="cat-logo-footer" />
    </footer>
  );
}

export function CatalogBrochure({ rows, mode, year }: { rows: BrochureRow[]; mode: BrochureMode; year: string }) {
  const pages = paginate(rows);
  return (
    <>
      <section className="cat-sheet cat-cover">
        <Logo className="cat-logo-cover" />
        <h1>catálogo</h1>
        <p className="cat-cover-pill">{mode === "atacado" ? "TABELA DE ATACADO" : "MOTOS ELÉTRICAS E A COMBUSTÃO"}</p>
        <p className="cat-cover-year">{year}</p>
        <Footer />
      </section>

      {pages.map((page, index) => (
        <section className="cat-sheet" key={`${page.category}-${index}`}>
          <header className="cat-header">
            <h2>catálogo</h2>
            <Logo className="cat-logo-header" />
          </header>
          <div className="cat-band">
            <strong>{page.title}</strong>
            <span>{mode === "atacado" ? "tabela de atacado" : `edição ${year}`}</span>
          </div>
          <div className="cat-body">
            {page.items.map((row, i) => (
              <Moto key={row.id} row={row} mode={mode} flip={i % 2 === 1} />
            ))}
          </div>
          <Footer />
        </section>
      ))}
    </>
  );
}
