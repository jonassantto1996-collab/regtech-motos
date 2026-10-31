import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { AdminShell } from "../../AdminShell";
import { requireAdminSession } from "../../products/actions";
import { BannerUploader } from "../components/BannerUploader";
import { BannerLinkPicker } from "../components/BannerLinkPicker";
import { BannerReplaceImage } from "../components/BannerReplaceImage";
import { BANNER_DEVICES, DEVICE_LABEL, type BannerDevice } from "@/lib/store/banners";
import { deleteStoreBanner, moveStoreBanner, removeStoreBannerImage, toggleStoreBanner, updateStoreBanner } from "./actions";
import "../../admin.css";
import "../store.css";

export const dynamic = "force-dynamic";

type BannerRow = {
  id: string;
  title: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
} & Record<`${BannerDevice}_path`, string | null> &
  Record<`${BannerDevice}_width` | `${BannerDevice}_height`, number | null>;

export default async function StoreBannersPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const admin = createAdminClient();
  const [{ data: banners }, { data: categories }] = await Promise.all([
    admin.from("store_banners").select("*").order("display_order").order("created_at"),
    admin.from("store_categories").select("slug,name").eq("is_active", true).order("sort_order"),
  ]);
  const list = (banners ?? []) as BannerRow[];
  const cats = categories ?? [];
  const { saved, error } = await searchParams;
  const activeCount = list.filter((b) => b.is_active).length;

  return (
    <AdminShell active="store" email={typeof data.claims.email === "string" ? data.claims.email : undefined}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>REGTECH CELL SHOP</span>
            <h1>Banners do topo</h1>
            <p>O topo da loja mostra primeiro o texto da loja e depois estes banners, girando sozinhos.</p>
          </div>
          <div className="store-heading-actions">
            <Link href="/admin/store" className="secondary-action">← Voltar para a loja</Link>
            <a href="/admin/store/banners/export" className="secondary-action">Exportar planilha</a>
          </div>
        </div>

        {saved && <p className="admin-alert success" role="status">{saved === "deleted" ? "Banner excluído." : "Alteração salva. Já vale no site."}</p>}
        {error && <p className="admin-alert error" role="alert">{error === "link" ? "Confira o nome e o link do banner." : "Não foi possível salvar. Tente de novo."}</p>}

        <BannerUploader categories={cats} existingCount={list.length} />

        <article className="panel batch-panel">
          <span className="batch-kicker">NO SITE AGORA</span>
          <h2>
            {list.length ? `${activeCount} de ${list.length} ${list.length === 1 ? "banner aparecendo" : "banners aparecendo"}` : "Nenhum banner ainda"}
          </h2>
          <p>A ordem aqui é a ordem do carrossel, depois do slide com o texto da loja.</p>

          {list.length > 0 && (
            <ol className="banner-list">
              {list.map((banner, index) => (
                <li key={banner.id} className={`banner-row ${banner.is_active ? "" : "is-paused"}`}>
                  <div className="banner-row-head">
                    <span className="banner-row-order">{index + 2}º slide</span>
                    <span className={`status-badge ${banner.is_active ? "" : "batch-hidden-badge"}`}>{banner.is_active ? "Aparecendo" : "Pausado"}</span>
                  </div>

                  <div className="banner-slots">
                    {BANNER_DEVICES.map((device) => {
                      const path = banner[`${device}_path`];
                      const width = banner[`${device}_width`];
                      const height = banner[`${device}_height`];
                      return (
                        <figure key={device} className={`banner-slot is-${device} ${path ? "" : "is-empty"}`}>
                          <figcaption>
                            <strong>{DEVICE_LABEL[device]}</strong>
                            {width && height ? <small>{width} × {height}</small> : null}
                          </figcaption>
                          {path ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={getPublicImageUrl(path)} alt={`${banner.title}: ${DEVICE_LABEL[device]}`} loading="lazy" />
                          ) : (
                            <span className="banner-slot-missing">Usa a do {device === "mobile" ? "tablet" : "computador"}</span>
                          )}
                          <span className="banner-slot-actions">
                            <BannerReplaceImage bannerId={banner.id} device={device} label={path ? "Trocar" : "Enviar"} />
                            {path && device !== "desktop" && (
                              <form action={removeStoreBannerImage.bind(null, banner.id, device)}>
                                <button type="submit" className="banner-mini-button is-quiet">Tirar</button>
                              </form>
                            )}
                          </span>
                        </figure>
                      );
                    })}
                  </div>

                  <form action={updateStoreBanner.bind(null, banner.id)} className="banner-fields">
                    <label className="admin-field">
                      Nome do banner
                      <input name="title" className="admin-control" defaultValue={banner.title} maxLength={120} required />
                    </label>
                    <div className="admin-field">
                      Ao clicar, abrir
                      <BannerLinkPicker categories={cats} value={banner.link_url ?? ""} name="link" />
                    </div>
                    <button type="submit" className="admin-secondary-button banner-save">Salvar</button>
                  </form>

                  <div className="banner-row-actions">
                    <form action={moveStoreBanner.bind(null, banner.id, "up")}>
                      <button type="submit" className="admin-secondary-button" disabled={index === 0} aria-label={`Subir ${banner.title}`}>↑ Subir</button>
                    </form>
                    <form action={moveStoreBanner.bind(null, banner.id, "down")}>
                      <button type="submit" className="admin-secondary-button" disabled={index === list.length - 1} aria-label={`Descer ${banner.title}`}>↓ Descer</button>
                    </form>
                    <form action={toggleStoreBanner.bind(null, banner.id)}>
                      <button type="submit" className="admin-secondary-button">{banner.is_active ? "Pausar" : "Mostrar no site"}</button>
                    </form>
                    <details className="banner-delete">
                      <summary className="admin-secondary-button">Excluir</summary>
                      <form action={deleteStoreBanner.bind(null, banner.id)}>
                        <span>Excluir “{banner.title}” e as 3 imagens?</span>
                        <button type="submit" className="admin-primary-button banner-delete-confirm">Sim, excluir</button>
                      </form>
                    </details>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </article>
      </section>
    </AdminShell>
  );
}
