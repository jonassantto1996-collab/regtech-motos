type Props = {
  brands: string[];
  categories: string[];
  priceBounds: { min: number; max: number } | null;
  selectedBrand?: string;
  selectedCategory?: string;
  selectedMinPrice?: string;
  selectedMaxPrice?: string;
};

const fieldLabel =
  "mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-600";
const fieldClass =
  "min-h-12 w-full border-0 border-b border-gray-300 bg-transparent px-0 py-3 text-sm text-gray-950 outline-none focus:border-blue-700 focus:ring-0";

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
    <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label htmlFor="brand" className={fieldLabel}>
          Marca
        </label>
        <select
          id="brand"
          name="brand"
          defaultValue={selectedBrand ?? ""}
          className={fieldClass}
        >
          <option value="">Todas as marcas</option>
          {brands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="category" className={fieldLabel}>
          Categoria
        </label>
        <select
          id="category"
          name="category"
          defaultValue={selectedCategory ?? ""}
          className={fieldClass}
        >
          <option value="">Todas as categorias</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="minPrice" className={fieldLabel}>
          Preço mínimo
        </label>
        <input
          id="minPrice"
          type="number"
          name="minPrice"
          min={0}
          step="0.01"
          defaultValue={selectedMinPrice}
          placeholder={priceBounds ? String(priceBounds.min) : undefined}
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="maxPrice" className={fieldLabel}>
          Preço máximo
        </label>
        <input
          id="maxPrice"
          type="number"
          name="maxPrice"
          min={0}
          step="0.01"
          defaultValue={selectedMaxPrice}
          placeholder={priceBounds ? String(priceBounds.max) : undefined}
          className={fieldClass}
        />
      </div>
    </div>
  );
}
