import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-4xl font-bold text-gray-900">Regtech Motos</h1>
      <p className="mt-4 max-w-md text-gray-600">
        Confira nosso catálogo de motos elétricas: preços, cores e
        especificações.
      </p>
      <Link
        href="/products"
        className="mt-8 rounded-md bg-blue-600 px-6 py-3 text-base font-semibold text-white transition hover:bg-blue-700"
      >
        Ver catálogo de motos
      </Link>
    </main>
  );
}
