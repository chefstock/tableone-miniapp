import { useState } from 'react';
import { fmtPrice } from '@/lib/format';
import type { CartItem, Product } from '@/types';

interface Props {
  open: boolean;
  items: CartItem[];
  products: Product[];
  isRetail?: boolean;
  onClose: () => void;
  onSubmit: (comment: string, paymentMethod: string) => void;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Наличные' },
  { value: 'card', label: 'Карта' },
  { value: 'transfer', label: 'Перевод' },
  { value: 'debt', label: 'В долг' },
];

export function ConfirmSheet({ open, items, products, isRetail, onClose, onSubmit }: Props) {
  const [comment, setComment] = useState('');
  const [payment, setPayment] = useState('cash');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const lines = items.map(ci => {
    const p = products.find(x => x.id === ci.product_id);
    return { ...ci, product: p };
  }).filter(x => x.product);

  const total = lines.reduce((s, l) => s + (l.product!.price * l.quantity), 0);

  const handleSubmit = async () => {
    setBusy(true);
    try {
      await onSubmit(comment, isRetail ? 'cash' : payment);
    } finally {
      setBusy(false);
      setComment('');
      setPayment('cash');
    }
  };

  const availableMethods = isRetail
    ? [{ value: 'cash', label: 'Наличные' }]
    : PAYMENT_METHODS;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        style={{ animation: 'fadeIn 0.2s ease' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-cream-100 rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{ animation: 'slideUp 0.3s ease' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-cream-300" />
        </div>

        <div className="px-5 pb-6">
          <h2 className="text-[18px] font-bold text-cream-800 mb-4">Подтверждение заказа</h2>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {lines.map(l => (
              <div key={l.product_id} className="flex items-center justify-between text-[13px]">
                <div className="flex-1 min-w-0">
                  <span className="text-cream-800 font-medium truncate block">{l.product!.name}</span>
                </div>
                <span className="text-cream-500 ml-2 whitespace-nowrap">
                  {l.quantity} × {fmtPrice(l.product!.price)}
                </span>
                <span className="text-cream-800 font-semibold ml-3 whitespace-nowrap">
                  {fmtPrice(l.product!.price * l.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between py-3 border-t border-cream-200 mb-4">
            <span className="text-[15px] font-bold text-cream-800">Итого</span>
            <span className="text-[17px] font-bold text-cream-500">{fmtPrice(total)} сум</span>
          </div>

          {/* Payment method */}
          <div className="mb-4">
            <p className="text-[12px] font-semibold text-cream-600 mb-2">Способ оплаты</p>
            <div className="grid grid-cols-2 gap-2">
              {availableMethods.map(pm => (
                <button
                  key={pm.value}
                  onClick={() => setPayment(pm.value)}
                  className={`py-2.5 px-3 rounded-xl text-[12px] font-semibold transition-colors ${
                    payment === pm.value
                      ? 'bg-cream-500 text-white'
                      : 'bg-white border border-cream-200 text-cream-600'
                  }`}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-5">
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Комментарий к заказу…"
              rows={2}
              maxLength={500}
              className="w-full px-4 py-3 rounded-xl bg-white border border-cream-200 text-[13px]
                         text-cream-800 placeholder:text-cream-400 outline-none resize-none"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full py-4 rounded-2xl bg-cream-500 text-white text-[15px] font-bold
                       active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {busy ? 'Отправка…' : `Оформить · ${fmtPrice(total)} сум`}
          </button>
        </div>
      </div>
    </>
  );
}

