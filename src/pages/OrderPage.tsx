import { useMemo, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { CategoryTabs } from '@/components/CategoryTabs';
import { CartBar } from '@/components/CartBar';
import type { CartItem, Product } from '@/types';

interface Props {
  products: Product[];
  cart: CartItem[];
  category: string;
  search: string;
  onCategoryChange: (cat: string) => void;
  onAdd: (id: number, delta?: number) => void;
  onSet: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onConfirm: () => void;
  summary: { count: number; total: number };
  getQty: (id: number) => number;
}

export function OrderPage({
  products, cart, category, search,
  onCategoryChange, onAdd, onSet, onRemove,
  onConfirm, summary, getQty,
}: Props) {
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category));
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (category !== 'all') {
      list = list.filter(p => p.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, category, search]);

  // Group by category
  const groups = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of filtered) {
      const arr = map.get(p.category) ?? [];
      arr.push(p);
      map.set(p.category, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="pb-24">
      {/* Category tabs */}
      <CategoryTabs
        categories={categories}
        active={category}
        onChange={onCategoryChange}
      />

      {/* Product list */}
      <div className="px-4 space-y-5 mt-2">
        {groups.map(([catName, prods]) => (
          <div key={catName}>
            {category === 'all' && (
              <h3 className="text-[13px] font-bold text-cream-500 uppercase tracking-wide mb-2 px-1">
                {catName}
              </h3>
            )}
            <div className="space-y-2">
              {prods.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  qty={getQty(p.id)}
                  onAdd={() => onAdd(p.id)}
                  onRemove={() => onRemove(p.id)}
                  onSet={qty => onSet(p.id, qty)}
                />
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-cream-400 text-[14px]">
            Ничего не найдено
          </div>
        )}
      </div>

      {/* Cart bar */}
      <CartBar count={summary.count} total={summary.total} onConfirm={onConfirm} />
    </div>
  );
}
