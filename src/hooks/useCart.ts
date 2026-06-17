import { useState, useCallback, useMemo } from 'react';
import type { CartItem, Product } from '@/types';

export function useCart() {
  const [items, setItems] = useState<Map<number, number>>(new Map());

  const add = useCallback((productId: number, delta: number = 1) => {
    setItems(prev => {
      const next = new Map(prev);
      const cur = next.get(productId) ?? 0;
      const qty = cur + delta;
      if (qty <= 0) next.delete(productId);
      else next.set(productId, qty);
      return next;
    });
  }, []);

  const set = useCallback((productId: number, qty: number) => {
    setItems(prev => {
      const next = new Map(prev);
      if (qty <= 0) next.delete(productId);
      else next.set(productId, qty);
      return next;
    });
  }, []);

  const remove = useCallback((productId: number) => {
    setItems(prev => {
      const next = new Map(prev);
      next.delete(productId);
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems(new Map()), []);

  /** Массив CartItem[] для API */
  const cart = useMemo<CartItem[]>(() =>
    Array.from(items.entries()).map(([product_id, quantity]) => ({ product_id, quantity })),
    [items],
  );

  const getQty = useCallback((productId: number) => items.get(productId) ?? 0, [items]);

  const summary = useCallback((products: Product[]) => {
    let count = 0;
    let total = 0;
    for (const [pid, qty] of items) {
      const p = products.find(x => x.id === pid);
      if (p) {
        count += qty;
        total += p.price * qty;
      }
    }
    return { count, total };
  }, [items]);

  return { cart, items, add, set, remove, clear, getQty, summary };
}
