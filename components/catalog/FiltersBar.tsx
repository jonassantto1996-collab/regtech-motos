type Props = {
  brands: string[];
  categories: string[];
  priceBounds: { min: number; max: number } | null;
  selectedBrand?: string;
  selectedCategory?: string;
  selectedMinPrice?: string;
  selectedMaxPrice?: string;
};

// Assim como SearchForm, não é um <form> próprio — renderizado dentro do
// <form> único de app/products/page.tsx.
export default function FiltersBar({
  brands,
  categories,
  priceBounds,
  selectedBrand,
  selectedCategory,
  selectedMinPrice,
  selectedMaxPrice,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div>
        <label htmlFor="brand" className="mb-1 block text-sm font-medium text-gray-700">
          Marca
        </label>
        <select
          id="brand"
          name="brand"
          defaultValue={selectedBrand ?? ""}
          className="w-full rounded border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="">Todas</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
          Categoria
        </label>
        <select
          id="category"
          name="category"
          defaultValue={selectedCategory ?? ""}
          className="w-full rounded border border-gray-300 px-2 py-2 text-sm"
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="minPrice" className="mb-1 block text-sm font-medium text-gray-700">
          Preço mín.
        </label>
        <input
          id="minPrice"
          type="number"
          name="minPrice"
          min={0}
          step="0.01"
          defaultValue={selectedMinPrice}
          placeholder={priceBounds ? String(priceBounds.min) : undefined}
          className="w-full rounded border border-gray-300 px-2 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="maxPrice" className="mb-1 block text-sm font-medium text-gray-700">
          Preço máx.
        </label>
        <input
          id="maxPrice"
          type="number"
          name="maxPrice"
          min={0}
          step="0.01"
          defaultValue={selectedMaxPrice}
          placeholder={priceBounds ? String(priceBounds.max) : undefined}
          className="w-full rounded border border-gray-300 px-2 py-2 text-sm"
        />
      </div>
    </div>
  );
}
