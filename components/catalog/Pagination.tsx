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

const navClass =
  "inline-flex min-h-11 items-center border-b border-gray-300 px-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors hover:border-blue-700 hover:text-blue-700";

export default function Pagination({
  currentPage,
  totalPages,
  currentSearchParams,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Paginação do catálogo"
      className="mt-16 flex items-center justify-between border-t border-gray-200 pt-7 text-sm"
    >
      {currentPage > 1 ? (
        <Link
          href={buildPageHref(currentPage - 1, currentSearchParams)}
          className={navClass}
        >
          ← Anterior
        </Link>
      ) : (
        <span className="min-h-11 px-1 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-300">
          ← Anterior
        </span>
      )}

      <span className="text-xs uppercase tracking-[0.12em] text-gray-500">
        {currentPage} / {totalPages}
      </span>

      {currentPage < totalPages ? (
        <Link
          href={buildPageHref(currentPage + 1, currentSearchParams)}
          className={navClass}
        >
          Próxima →
        </Link>
      ) : (
        <span className="min-h-11 px-1 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-300">
          Próxima →
        </span>
      )}
    </nav>
  );
}
