import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-gray-900">
        Produto não encontrado
      </h1>
      <p className="mt-2 text-gray-600">
        O produto que você procura não existe ou não está mais disponível.
      </p>
      <Link
        href="/products"
        className="mt-6 inline-block rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Voltar ao catálogo
      </Link>
    </main>
  );
}
