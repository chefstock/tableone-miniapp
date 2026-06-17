import { fmtPrice } from '@/lib/format';
import type { Product } from '@/types';

interface Props {
  product: Product;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
  onSet: (qty: number) => void;
}

export function ProductCard({ product, qty, onAdd, onRemove, onSet }: Props) {
  const { name, price, unit, photo_url, in_stock, min_order } = product;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-cream-200/60 transition-all ${
      !in_stock ? 'opacity-40 pointer-events-none' : ''
    }`}>
      {/* Photo */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream-200 flex-shrink-0">
        {photo_url ? (
          <img
            src={photo_url}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-cream-400 text-2xl">
            🧁
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-cream-800 truncate leading-tight">
          {name}
        </p>
        <p className="text-[15px] font-bold text-cream-500 mt-0.5">
          {fmtPrice(price)} <span className="text-[11px] font-normal text-cream-400">сум/{unit}</span>
        </p>
        {min_order > 1 && (
          <p className="text-[10px] text-cream-400 mt-0.5">мин. {min_order} {unit}</p>
        )}
      </div>

      {/* Stepper */}
      <div className="flex-shrink-0">
        {qty === 0 ? (
          <button
            onClick={onAdd}
            className="w-10 h-10 rounded-xl bg-cream-500 text-white flex items-center justify-center
                       active:scale-90 transition-transform text-xl font-light"
          >
            +
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={onRemove}
              className="w-8 h-8 rounded-lg bg-cream-200 text-cream-600 flex items-center justify-center
                         active:scale-90 transition-transform text-sm font-bold"
            >
              −
            </button>
            <input
              type="number"
              value={qty}
              onChange={e => {
                const v = parseInt(e.target.value) || 0;
                onSet(v);
              }}
              className="w-10 h-8 text-center text-[13px] font-semibold bg-white border border-cream-200
                         rounded-lg outline-none text-cream-800
                         [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={onAdd}
              className="w-8 h-8 rounded-lg bg-cream-500 text-white flex items-center justify-center
                         active:scale-90 transition-transform text-sm font-bold"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
