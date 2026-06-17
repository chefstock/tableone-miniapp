interface Props {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}

export function CategoryTabs({ categories, active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
      <button
        onClick={() => onChange('all')}
        className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition-colors ${
          active === 'all'
            ? 'bg-cream-500 text-white'
            : 'bg-white/80 text-cream-600 border border-cream-200'
        }`}
      >
        Все
      </button>
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap ${
            active === cat
              ? 'bg-cream-500 text-white'
              : 'bg-white/80 text-cream-600 border border-cream-200'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
