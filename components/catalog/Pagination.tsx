import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  currentSearchParams: Record<string, string | undefined>;
};

function buildPageHref(
  page: number,
  currentSearchParams: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(currentSearchParams)) {
    if (value && key !== "page") {
      params.set(key, value);
    }
  }
  params.set("page", String(page));
  return `/products?${params.toString()}`;
}

export default function Pagination({
  currentPage,
  totalPages,
  currentSearchParams,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-8 flex items-center justify-center gap-4 text-sm"
    >
      {currentPage > 1 ? (
        <Link
          href={buildPageHref(currentPage - 1, currentSearchParams)}
          className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded border border-gray-200 px-3 py-1.5 text-gray-400">
          ← Anterior
        </span>
      )}

      <span className="text-gray-600">
        Página {currentPage} de {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={buildPageHref(currentPage + 1, currentSearchParams)}
          className="rounded border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
        >
          Próxima →
        </Link>
      ) : (
        <span className="cursor-not-allowed rounded border border-gray-200 px-3 py-1.5 text-gray-400">
          Próxima →
        </span>
      )}
    </nav>
  );
}
