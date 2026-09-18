import Link from "next/link";
import type { Metadata } from "next";
import SearchForm from "@/components/catalog/SearchForm";
import FiltersBar from "@/components/catalog/FiltersBar";
import SortSelect from "@/components/catalog/SortSelect";
import ProductCard from "@/components/catalog/ProductCard";
import Pagination from "@/components/catalog/Pagination";
import {
  listProducts,
  getActiveProductBrands,
  getActiveProductCategories,
  getActiveProductPriceBounds,
  type SortOption,
} from "@/lib/catalog/queries";

export const metadata: Metadata = {
  title: "Catálogo de Motos — Regtech Motors",
  description:
    "Confira as motos elétricas disponíveis no catálogo da Regtech Motors: preços, cores e especificações.",
  alternates: { canonical: "/products" },
};

export const dynamic = "force-dynamic";

type SearchParamsShape = {
  q?: string;
  brand?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  page?: string;
};

const VALID_SORTS: SortOption[] = ["recent", "price_asc", "price_desc"];

function parsePositiveNumber(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsShape>;
}) {
  const sp = await searchParams;

  const sort: SortOption = VALID_SORTS.includes(sp.sort as SortOption)
    ? (sp.sort as SortOption)
    : "recent";

  const page = Math.max(1, Number(sp.page) || 1);
  const minPrice = parsePositiveNumber(sp.minPrice);
  const maxPrice = parsePositiveNumber(sp.maxPrice);
  const hasFilters = Boolean(
    sp.q || sp.brand || sp.category || sp.minPrice || sp.maxPrice
  );

  const [result, brands, categories, priceBounds] = await Promise.all([
    listProducts({
      q: sp.q,
      brand: sp.brand,
      category: sp.category,
      minPrice,
      maxPrice,
      sort,
      page,
    }),
    getActiveProductBrands(),
    getActiveProductCategories(),
    getActiveProductPriceBounds(),
  ]);

  return (
    <main>
      <header className="border-b border-blue-900 bg-blue-950 px-4 py-12 text-white sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">
            Regtech Motors
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Catálogo de motos elétricas
            </h1>
            <p className="max-w-md text-sm leading-6 text-blue-100 sm:text-base">
              Explore os modelos disponíveis e encontre a opção que combina
              com a sua forma de se movimentar.
            </p>
          </div>
        </div>
      </header>

      <section className="bg-white px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <form method="GET" action="/products">
            <div className="grid gap-6 border-b border-gray-200 pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <SearchForm defaultValue={sp.q} />
              <SortSelect value={sort} />
            </div>

            <div className="border-b border-gray-200 py-7">
              <FiltersBar
                brands={brands}
                categories={categories}
                priceBounds={priceBounds}
                selectedBrand={sp.brand}
                selectedCategory={sp.category}
                selectedMinPrice={sp.minPrice}
                selectedMaxPrice={sp.maxPrice}
              />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                  {hasFilters && (
                    <Link
                      href="/products"
                      className="font-medium text-gray-700 underline decoration-gray-300 underline-offset-4 hover:text-blue-700"
                    >
                      Limpar filtros
                    </Link>
                  )}
                </div>
                <button
                  type="submit"
                  className="min-h-12 w-full bg-gray-950 px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-blue-700 sm:w-auto"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </form>

          <div className="flex items-end justify-between gap-4 py-8 lg:py-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                Modelos
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                {result.products.length === 0
                  ? "Nenhum resultado"
                  : "Motos disponíveis"}
              </h2>
            </div>
          </div>

          {result.products.length === 0 ? (
            <div className="border-y border-gray-200 py-16 text-center text-gray-500">
              <p>Nenhum produto encontrado com esses critérios.</p>
              {hasFilters && (
                <Link
                  href="/products"
                  className="mt-4 inline-block text-sm font-semibold uppercase tracking-[0.12em] text-blue-700 underline underline-offset-4"
                >
                  Limpar filtros
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:gap-x-12 lg:gap-y-20">
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <Pagination
            currentPage={result.page}
            totalPages={result.totalPages}
            currentSearchParams={sp}
          />
        </div>
      </section>
    </main>
  );
}
