import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelegram } from '@/hooks/useTelegram';
import { useCart } from '@/hooks/useCart';
import { fetchProducts, createOrder, createReturn } from '@/lib/api';
import { OrderPage } from '@/pages/OrderPage';
import { ReturnPage } from '@/pages/ReturnPage';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { SuccessOverlay } from '@/components/SuccessOverlay';
import type { Product } from '@/types';

type Mode = 'order' | 'retail' | 'return';

const REFRESH_INTERVAL = 30_000; // 30 секунд

export default function App() {
  const { initData, ready, haptic, showAlert } = useTelegram();
  const { cart, add, set, remove, clear, getQty, summary } = useCart();
  const { cart: retailCart, add: retailAdd, set: retailSet, remove: retailRemove, clear: retailClear, getQty: retailGetQty, summary: retailSummary } = useCart();

  const [mode, setMode] = useState<Mode>('order');
  const [products, setProducts] = useState<Product[]>([]);
  const [restaurant, setRestaurant] = useState('');
  const [isRetail, setIsRetail] = useState(false);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banned, setBanned] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successType, setSuccessType] = useState<'order' | 'return' | null>(null);
  const [lastOrderNumber, setLastOrderNumber] = useState('');
  const lastFetch = useRef(0);

  // Init
  useEffect(() => {
    ready();
  }, [ready]);

  // Загрузка/обновление продуктов
  const refreshProducts = useCallback((showLoader = false) => {
    if (!initData) return;
    // Не чаще чем раз в 5 секунд
    if (Date.now() - lastFetch.current < 5000) return;
    lastFetch.current = Date.now();

    if (showLoader) setLoading(true);

    fetchProducts(initData)
      .then(data => {
        setProducts(data.products);
        setRestaurant(data.restaurant);
        setIsRetail(data.is_retail ?? false);
        setError('');
      })
      .catch(err => {
        if (err.status === 403) {
          setBanned(true);
        } else if (showLoader) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (showLoader) setLoading(false);
      });
  }, [initData]);

  // Первая загрузка
  useEffect(() => {
    if (!initData) {
      setError('Откройте через Telegram');
      setLoading(false);
      return;
    }
    refreshProducts(true);
  }, [initData, refreshProducts]);

  // Авто-обновление: visibility change + polling
  useEffect(() => {
    if (!initData) return;

    // При возврате в приложение — обновить сразу
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshProducts(false);
      }
    };

    // Polling каждые 30с
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshProducts(false);
      }
    }, REFRESH_INTERVAL);

    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(interval);
    };
  }, [initData, refreshProducts]);

  const handleConfirm = useCallback(() => {
    const activeCart = mode === 'retail' ? retailCart : cart;
    if (activeCart.length === 0) return;
    haptic('medium');
    setConfirmOpen(true);
  }, [cart, retailCart, mode, haptic]);

  const handleSubmitOrder = useCallback(async (comment: string, paymentMethod: string) => {
    try {
      const isRetailMode = mode === 'retail';
      const activeCart = isRetailMode ? retailCart : cart;
      const res = await createOrder(initData, activeCart, comment, isRetailMode ? 'cash' : paymentMethod, isRetailMode);
      setLastOrderNumber(res.order_number);
      if (isRetailMode) retailClear(); else clear();
      setConfirmOpen(false);
      setSuccessType('order');
      haptic('heavy');
    } catch (err: any) {
      showAlert(err.message || 'Ошибка при создании заказа');
    }
  }, [initData, cart, retailCart, mode, clear, retailClear, haptic, showAlert]);

  const handleSubmitReturn = useCallback(async (
    orderId: number,
    items: { product_id: number; quantity: number }[],
    reason: string,
  ) => {
    try {
      await createReturn(initData, orderId, items, reason);
      setSuccessType('return');
      haptic('heavy');
    } catch (err: any) {
      showAlert(err.message || 'Ошибка при создании возврата');
    }
  }, [initData, haptic, showAlert]);

  const handleDone = useCallback(() => {
    setSuccessType(null);
    setLastOrderNumber('');
  }, []);

  const currentSummary = mode === 'retail' ? retailSummary(products) : summary(products);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream-100">
        <div className="w-8 h-8 border-3 border-cream-300 border-t-cream-500 rounded-full animate-spin mb-4" />
        <p className="text-[13px] text-cream-400">Загрузка каталога…</p>
      </div>
    );
  }

  // Banned state
  if (banned) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream-100 px-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <p className="text-[18px] font-bold text-red-600 mb-2">Доступ приостановлен</p>
        <p className="text-[13px] text-cream-500 text-center leading-relaxed mb-4">
          Замечена подозрительная<br/>активность в аккаунте
        </p>
        <p className="text-[12px] text-cream-400">Обратитесь к администратору</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream-100 px-8">
        <div className="text-4xl mb-4">😕</div>
        <p className="text-[14px] text-cream-500 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-cream-100/95 backdrop-blur-sm border-b border-cream-200/50">
        {/* Restaurant name */}
        <div className="px-4 pt-10 pb-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-bold text-cream-800">{restaurant}</h1>
            {isRetail && (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-semibold">
                Розница
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-1.5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск товаров…"
            className="w-full px-4 py-2.5 rounded-xl bg-white/80 border border-cream-200/60
                       text-[13px] text-cream-800 placeholder:text-cream-400 outline-none"
          />
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-cream-200/50">
          <button
            onClick={() => setMode('order')}
            className={`flex-1 py-2.5 text-[13px] font-semibold text-center border-b-[2.5px] transition-colors ${
              mode === 'order'
                ? 'text-cream-500 border-cream-500'
                : 'text-cream-400 border-transparent'
            }`}
          >
            {isRetail ? 'Каталог' : 'Заказ'}
          </button>
          {!isRetail && (
            <button
              onClick={() => setMode('retail')}
              className={`flex-1 py-2.5 text-[13px] font-semibold text-center border-b-[2.5px] transition-colors ${
                mode === 'retail'
                  ? 'text-orange-500 border-orange-500'
                  : 'text-cream-400 border-transparent'
              }`}
            >
              Розница
            </button>
          )}
          {!isRetail && (
            <button
              onClick={() => setMode('return')}
              className={`flex-1 py-2.5 text-[13px] font-semibold text-center border-b-[2.5px] transition-colors ${
                mode === 'return'
                  ? 'text-cream-500 border-cream-500'
                  : 'text-cream-400 border-transparent'
              }`}
            >
              Возврат
            </button>
          )}
        </div>
      </div>

      {/* Pages */}
      {mode === 'order' ? (
        <OrderPage
          products={products}
          cart={cart}
          category={category}
          search={search}
          onCategoryChange={setCategory}
          onAdd={(id, d) => { add(id, d); haptic('light'); }}
          onSet={set}
          onRemove={(id) => { remove(id); haptic('light'); }}
          onConfirm={handleConfirm}
          summary={currentSummary}
          getQty={getQty}
        />
      ) : mode === 'retail' ? (
        <OrderPage
          products={products}
          cart={retailCart}
          category={category}
          search={search}
          onCategoryChange={setCategory}
          onAdd={(id, d) => { retailAdd(id, d); haptic('light'); }}
          onSet={retailSet}
          onRemove={(id) => { retailRemove(id); haptic('light'); }}
          onConfirm={handleConfirm}
          summary={currentSummary}
          getQty={retailGetQty}
        />
      ) : (
        <ReturnPage
          initData={initData}
          onSubmit={handleSubmitReturn}
        />
      )}

      {/* Confirm sheet */}
      <ConfirmSheet
        open={confirmOpen}
        items={mode === 'retail' ? retailCart : cart}
        products={products}
        isRetail={mode === 'retail' || isRetail}
        onClose={() => setConfirmOpen(false)}
        onSubmit={handleSubmitOrder}
      />

      {/* Success */}
      <SuccessOverlay
        open={successType !== null}
        type={successType ?? 'order'}
        orderNumber={lastOrderNumber}
        onDone={handleDone}
      />
    </div>
  );
}
