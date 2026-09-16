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
  title: "Catálogo de Motos — Regtech Motos",
  description:
    "Confira as motos elétricas disponíveis no catálogo da Regtech Motos: preços, cores e especificações.",
  alternates: { canonical: "/products" },
};

// Renderização totalmente dinâmica (sem cache/revalidation) — decisão
// aprovada: alterações no admin devem aparecer imediatamente aqui.
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
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">
        Catálogo de motos
      </h1>

      {/*
        Único <form> envolvendo busca + filtros + ordenação: ao submeter
        qualquer um deles, os demais campos já preenchidos vão junto na
        mesma requisição GET (comportamento nativo do HTML), sem perder
        nenhum critério já aplicado.
      */}
      <form
        method="GET"
        action="/products"
        className="mb-8 space-y-4 rounded-lg border border-gray-200 p-4"
      >
        <SearchForm defaultValue={sp.q} />
        <FiltersBar
          brands={brands}
          categories={categories}
          priceBounds={priceBounds}
          selectedBrand={sp.brand}
          selectedCategory={sp.category}
          selectedMinPrice={sp.minPrice}
          selectedMaxPrice={sp.maxPrice}
        />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SortSelect value={sort} />
          <button
            type="submit"
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Aplicar
          </button>
        </div>
      </form>

      {result.products.length === 0 ? (
        <p className="py-12 text-center text-gray-500">
          Nenhum produto encontrado com esses critérios.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
    </main>
  );
}
