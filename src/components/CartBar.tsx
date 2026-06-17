import { fmtPrice, plural } from '@/lib/format';

interface Props {
  count: number;
  total: number;
  onConfirm: () => void;
}

export function CartBar({ count, total, onConfirm }: Props) {
  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pt-2 bg-gradient-to-t from-cream-100 via-cream-100/95 to-transparent">
      <button
        onClick={onConfirm}
        className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl
                   bg-cream-500 text-white active:scale-[0.98] transition-transform shadow-lg"
      >
        <span className="text-[14px] font-semibold">
          Корзина · {count} {plural(count, 'позиция', 'позиции', 'позиций')}
        </span>
        <span className="text-[15px] font-bold">
          {fmtPrice(total)} сум
        </span>
      </button>
    </div>
  );
}
