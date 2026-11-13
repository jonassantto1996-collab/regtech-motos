import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "../AdminShell";
import { requireAdminSession } from "../products/actions";
import { brochurePrice } from "@/lib/catalog/brochure";
import "../admin.css";

export const dynamic = "force-dynamic";

/** Catálogo em PDF das motos (varejo e atacado), montado com o que está cadastrado. */
export default async function CatalogBrochurePage() {
  await requireAdminSession();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/admin/login");

  const { data: rows } = await createAdminClient()
    .from("products")
    .select("id,brand,model,price,wholesale_price,product_images(id)")
    .eq("is_active", true)
    .order("brand");
  const motos = (rows ?? []) as { id: string; brand: string; model: string; price: number; wholesale_price: number | null; product_images: { id: string }[] | null }[];
  const noWholesale = motos.filter((m) => brochurePrice("atacado", m).kind === "consulte");
  const noPhoto = motos.filter((m) => !(m.product_images ?? []).length);

  return (
    <AdminShell active="products" email={typeof data.claims.email === "string" ? data.claims.email : undefined}>
      <section className="admin-content admin-page">
        <div className="page-heading">
          <div>
            <span>CATÁLOGO</span>
            <h1>Catálogo em PDF</h1>
            <p>
              Monta o catálogo das {motos.length} motos ativas com as fotos, cores, ficha técnica e preços cadastrados. Mudou algo
              na moto? O catálogo já sai atualizado.
            </p>
          </div>
          <Link href="/admin/products" className="secondary-action">← Voltar para as motos</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="panel">
            <h2>Varejo</h2>
            <p className="form-muted">Para clientes e grupos: “10x sem juros” (preço à vista dividido por 10) e o valor final.</p>
            <Link href="/admin/catalogo/pdf?tipo=varejo" target="_blank" className="admin-primary-button">Abrir catálogo de varejo</Link>
          </article>
          <article className="panel">
            <h2>Atacado</h2>
            <p className="form-muted">Para lojistas: mostra o preço de atacado de cada moto (cadastrado na tela da moto).</p>
            <Link href="/admin/catalogo/pdf?tipo=atacado" target="_blank" className="admin-primary-button">Abrir catálogo de atacado</Link>
          </article>
          <article className="panel">
            <h2>Sem preços</h2>
            <p className="form-muted">Para apresentar as motos: fotos, cores e ficha técnica, com “Consulte valores” no lugar do preço.</p>
            <Link href="/admin/catalogo/pdf?tipo=consulta" target="_blank" className="admin-primary-button">Abrir catálogo sem preços</Link>
          </article>
        </div>

        {(noWholesale.length > 0 || noPhoto.length > 0) && (
          <article className="panel">
            {noWholesale.length > 0 && (
              <>
                <h2>Sem preço de atacado ({noWholesale.length})</h2>
                <p className="form-muted">No catálogo de atacado essas motos aparecem como “Consulte”. Preencha o “Preço de atacado” na tela da moto.</p>
                <ul>
                  {noWholesale.map((m) => (
                    <li key={m.id}><Link href={`/admin/products/${m.id}/edit`}>{m.brand} {m.model}</Link></li>
                  ))}
                </ul>
              </>
            )}
            {noPhoto.length > 0 && (
              <>
                <h2>Sem foto ({noPhoto.length})</h2>
                <ul>
                  {noPhoto.map((m) => (
                    <li key={m.id}><Link href={`/admin/products/${m.id}/images`}>{m.brand} {m.model}</Link></li>
                  ))}
                </ul>
              </>
            )}
          </article>
        )}
      </section>
    </AdminShell>
  );
}
