export default function SearchForm({ defaultValue }: { defaultValue?: string }) {
  return (
    <div>
      <label
        htmlFor="q"
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-600"
      >
        Buscar modelo
      </label>
      <input
        id="q"
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Marca ou modelo"
        className="min-h-12 w-full border-0 border-b border-gray-300 bg-transparent px-0 py-3 text-base text-gray-950 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-700 focus:ring-0"
      />
    </div>
  );
}
