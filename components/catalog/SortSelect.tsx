import { SORT_OPTIONS, type SortOption } from "@/lib/catalog/queries";

// Também renderizado dentro do <form> único de app/products/page.tsx.
export default function SortSelect({ value }: { value: SortOption }) {
  return (
    <div>
      <label htmlFor="sort" className="mb-1 block text-sm font-medium text-gray-700">
        Ordenar por
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={value}
        className="w-full rounded border border-gray-300 px-2 py-2 text-sm sm:w-56"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
