// Não é um <form> próprio: este campo é renderizado dentro do único
// <form method="GET"> da página de listagem (app/products/page.tsx), junto
// com FiltersBar e SortSelect, pra que buscar não descarte os filtros/
// ordenação já aplicados (e vice-versa).
export default function SearchForm({ defaultValue }: { defaultValue?: string }) {
  return (
    <div>
      <label htmlFor="q" className="mb-1 block text-sm font-medium text-gray-700">
        Buscar
      </label>
      <input
        id="q"
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Marca ou modelo..."
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
