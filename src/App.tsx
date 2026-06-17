import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import type { Product } from '@/types';

const BASE = import.meta.env.VITE_API_URL || '/api/miniapp';

async function api<T>(path: string, initData: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `tma ${initData}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err: any = new Error('Request failed');
    err.status = res.status;
    try { Object.assign(err, await res.json()); } catch {}
    throw err;
  }
  return res.json();
}

export default function App() {
  const { initData, ready, haptic, showAlert } = useTelegram();
  const [products, setProducts] = useState<Product[]>([]);
  const [restaurant, setRestaurant] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const lastFetch = useRef(0);

  useEffect(() => { ready(); }, [ready]);

  const refresh = useCallback((showLoader = false) => {
    if (!initData) return;
    if (Date.now() - lastFetch.current < 5000) return;
    lastFetch.current = Date.now();
    if (showLoader) setLoading(true);

    api<{ products: Product[]; restaurant: string }>('/products', initData)
      .then(data => {
        setProducts(data.products);
        setRestaurant(data.restaurant);
        setError('');
      })
      .catch(err => {
        if (showLoader) setError(err.message || 'Ошибка загрузки');
      })
      .finally(() => { if (showLoader) setLoading(false); });
  }, [initData]);

  useEffect(() => {
    if (!initData) { setError('Откройте через Telegram'); setLoading(false); return; }
    refresh(true);
  }, [initData, refresh]);

  const lunchPrice = products.reduce((s, p) => s + p.price, 0);
  const total = lunchPrice * quantity;

  const handleOrder = async () => {
    if (quantity <= 0 || !initData) return;
    setSubmitting(true);
    try {
      const items = products.map(p => ({ product_id: p.id, quantity }));
      const res = await api<{ order_number: string }>('/orders', initData, {
        method: 'POST',
        body: JSON.stringify({ items, comment: `Бизнес-ланч x${quantity}`, payment_method: 'debt' }),
      });
      setSuccess(res.order_number);
      setQuantity(0);
      haptic('heavy');
    } catch (err: any) {
      showAlert(err.message || 'Ошибка при создании заказа');
    } finally {
      setSubmitting(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mb-4" />
        <p className="text-[13px] text-gray-400">Загрузка меню…</p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-8">
        <p className="text-4xl mb-4">😕</p>
        <p className="text-[14px] text-gray-500 text-center">{error}</p>
        <button onClick={() => refresh(true)} className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-full text-[13px]">
          Повторить
        </button>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-8">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-[20px] font-bold text-gray-900 mb-2">Заказ оформлен</p>
        <p className="text-[14px] text-gray-500 mb-1">#{success}</p>
        <p className="text-[13px] text-gray-400 mb-6">Ожидайте подтверждения</p>
        <button onClick={() => setSuccess('')} className="px-8 py-2.5 bg-gray-900 text-white rounded-full text-[13px] font-medium">
          Новый заказ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-[18px] font-bold text-gray-900">TableOne</h1>
        <p className="text-[12px] text-gray-400 mt-0.5">{restaurant}</p>
      </div>

      {/* Menu day label */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium">Меню дня</p>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-gray-400">Цена за ланч</p>
            <p className="text-[18px] font-bold text-gray-900">{lunchPrice.toLocaleString('ru-RU')} <span className="text-[12px] font-normal text-gray-400">сум</span></p>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="flex-1 px-5 py-2">
        <div className="space-y-1">
          {products.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
              <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-medium text-gray-500 flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-[14px] text-gray-900">{p.name}</p>
              </div>
              <p className="text-[12px] text-gray-400">{p.price.toLocaleString('ru-RU')} сум</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quantity selector */}
      <div className="px-5 py-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400 uppercase tracking-wider font-medium mb-3 text-center">Количество ланчей</p>
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => { if (quantity > 0) { setQuantity(q => q - 1); haptic('light'); } }}
            className="w-12 h-12 rounded-full border-2 border-gray-200 flex items-center justify-center text-[22px] text-gray-400 active:bg-gray-100 transition-colors"
            disabled={quantity <= 0}
          >
            −
          </button>
          <span className="text-[36px] font-bold text-gray-900 min-w-[60px] text-center tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => { setQuantity(q => q + 1); haptic('light'); }}
            className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-[22px] text-white active:bg-gray-700 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* Bottom bar */}
      {quantity > 0 && (
        <div className="px-5 py-4 bg-gray-900 flex items-center justify-between animate-slideUp">
          <div>
            <p className="text-[12px] text-gray-400">{quantity} × {lunchPrice.toLocaleString('ru-RU')}</p>
            <p className="text-[18px] font-bold text-white">{total.toLocaleString('ru-RU')} сум</p>
          </div>
          <button
            onClick={handleOrder}
            disabled={submitting}
            className="px-6 py-3 bg-white text-gray-900 rounded-full text-[14px] font-semibold active:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Отправка…' : 'Заказать →'}
          </button>
        </div>
      )}
    </div>
  );
}
