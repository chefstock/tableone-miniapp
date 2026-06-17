import { useState, useEffect } from 'react';
import { fmtPrice } from '@/lib/format';
import { fetchOrderHistory } from '@/lib/api';
import { RETURN_REASONS } from '@/types';
import type { OrderHistoryItem, ReturnReason } from '@/types';

interface Props {
  initData: string;
  onSubmit: (orderId: number, items: { product_id: number; quantity: number }[], reason: string) => void;
}

export function ReturnPage({ initData, onSubmit }: Props) {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderHistoryItem | null>(null);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [returnQty, setReturnQty] = useState<Record<number, number>>({});
  const [reason, setReason] = useState<ReturnReason | ''>('');
  const [customReason, setCustomReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initData) return;
    setLoading(true);
    fetchOrderHistory(initData, 20)
      .then(data => {
        setOrders(data.orders.filter(o => ['confirmed', 'delivered'].includes(o.status)));
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [initData]);

  const toggleItem = (idx: number, maxQty: number) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
        setReturnQty(q => { const n = { ...q }; delete n[idx]; return n; });
      } else {
        next.add(idx);
        setReturnQty(q => ({ ...q, [idx]: maxQty }));
      }
      return next;
    });
  };

  const updateQty = (idx: number, val: number, max: number) => {
    const clamped = Math.max(1, Math.min(val, max));
    setReturnQty(q => ({ ...q, [idx]: clamped }));
  };

  const handleSubmit = async () => {
    if (!selectedOrder || checked.size === 0 || (!reason && !customReason.trim())) return;
    setBusy(true);

    const items = selectedOrder.items
      .filter((_, i) => checked.has(i))
      .map((it, i) => ({
        product_id: it.product_id,
        quantity: returnQty[i] ?? it.qty,
      }));

    const reasonText = reason === 'other' ? customReason.trim() : RETURN_REASONS[reason as ReturnReason];

    try {
      await onSubmit(selectedOrder.id, items, reasonText);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-cream-400 border-t-cream-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedOrder) {
    return (
      <div className="px-4 py-3">
        <h3 className="text-[14px] font-bold text-cream-800 mb-3">Выберите заказ для возврата</h3>
        {orders.length === 0 ? (
          <p className="text-[13px] text-cream-400 text-center py-10">
            Нет заказов для возврата
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map(o => (
              <button
                key={o.id}
                onClick={() => { setSelectedOrder(o); setChecked(new Set()); setReturnQty({}); setReason(''); }}
                className="w-full text-left p-4 rounded-2xl bg-white/70 border border-cream-200/60
                           active:scale-[0.98] transition-transform"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-bold text-cream-800">
                    {o.order_number}
                  </span>
                  <span className="text-[11px] text-cream-400">
                    {new Date(o.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <p className="text-[12px] text-cream-500">
                  {o.items.length} поз. · {fmtPrice(o.total)} сум
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 pb-32">
      <button
        onClick={() => setSelectedOrder(null)}
        className="text-[13px] text-cream-500 font-semibold mb-3 flex items-center gap-1"
      >
        ← Назад к заказам
      </button>

      <h3 className="text-[14px] font-bold text-cream-800 mb-1">
        Возврат из {selectedOrder.order_number}
      </h3>
      <p className="text-[12px] text-cream-400 mb-4">Отметьте товары и укажите количество</p>

      <div className="space-y-2 mb-5">
        {selectedOrder.items.map((it, i) => (
          <div
            key={i}
            className={`rounded-xl border transition-colors ${
              checked.has(i)
                ? 'bg-cream-500/5 border-cream-500'
                : 'bg-white/70 border-cream-200/60'
            }`}
          >
            <label className="flex items-center gap-3 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={checked.has(i)}
                onChange={() => toggleItem(i, it.qty)}
                className="w-5 h-5 rounded accent-cream-500 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-cream-800 truncate">{it.name}</p>
                <p className="text-[11px] text-cream-400">
                  {it.qty} × {fmtPrice(it.price)} = {fmtPrice(it.total)}
                </p>
              </div>
            </label>

            {checked.has(i) && (
              <div className="flex items-center gap-2 px-3 pb-3 pt-1">
                <span className="text-[11px] text-cream-500">Кол-во возврата:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(i, (returnQty[i] ?? it.qty) - 1, it.qty)}
                    className="w-7 h-7 rounded-lg bg-cream-200 text-cream-600 flex items-center justify-center
                               active:scale-90 transition-transform text-sm font-bold"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={returnQty[i] ?? it.qty}
                    onChange={e => updateQty(i, parseInt(e.target.value) || 1, it.qty)}
                    className="w-10 h-7 text-center text-[13px] font-semibold bg-white border border-cream-200
                               rounded-lg outline-none text-cream-800
                               [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => updateQty(i, (returnQty[i] ?? it.qty) + 1, it.qty)}
                    className="w-7 h-7 rounded-lg bg-cream-500 text-white flex items-center justify-center
                               active:scale-90 transition-transform text-sm font-bold"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] text-cream-400">из {it.qty}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {checked.size > 0 && (
        <>
          <h4 className="text-[13px] font-bold text-cream-800 mb-2">Причина возврата</h4>
          <div className="space-y-2 mb-4">
            {(Object.entries(RETURN_REASONS) as [ReturnReason, string][]).map(([key, label]) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  reason === key
                    ? 'bg-cream-500/5 border-cream-500'
                    : 'bg-white/70 border-cream-200/60'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  checked={reason === key}
                  onChange={() => setReason(key)}
                  className="accent-cream-500"
                />
                <span className="text-[13px] text-cream-700">{label}</span>
              </label>
            ))}
          </div>

          {reason === 'other' && (
            <textarea
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Опишите причину…"
              rows={2}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl bg-white border border-cream-200
                         text-[13px] text-cream-800 placeholder:text-cream-400 outline-none resize-none mb-4"
            />
          )}
        </>
      )}

      {checked.size > 0 && reason && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pt-2 bg-gradient-to-t from-cream-100 via-cream-100/95 to-transparent">
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-red-500 text-white text-[14px] font-bold
                       active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {busy ? 'Отправка…' : `Оформить возврат (${checked.size} поз.)`}
          </button>
        </div>
      )}
    </div>
  );
}
