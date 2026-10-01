import { SORT_OPTIONS, type SortOption } from "@/lib/catalog/queries";

export default function SortSelect({ value }: { value: SortOption }) {
  return (
    <div className="lg:min-w-64">
      <label
        htmlFor="sort"
        className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-gray-600"
      >
        Ordenar por
      </label>
      <select
        id="sort"
        name="sort"
        defaultValue={value}
        className="min-h-12 w-full border-0 border-b border-gray-300 bg-transparent px-0 py-3 text-sm text-gray-950 outline-none focus:border-blue-700 focus:ring-0"
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
