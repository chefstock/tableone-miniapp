interface Props {
  open: boolean;
  type: 'order' | 'return';
  orderNumber?: string;
  onDone: () => void;
}

export function SuccessOverlay({ open, type, orderNumber, onDone }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-cream-100 flex flex-col items-center justify-center px-8"
      style={{ animation: 'fadeIn 0.3s ease' }}
    >
      <div
        className="text-6xl mb-6"
        style={{ animation: 'scaleIn 0.4s ease 0.1s both' }}
      >
        {type === 'order' ? '✅' : '↩️'}
      </div>
      <h2
        className="text-[20px] font-bold text-cream-800 mb-2 text-center"
        style={{ animation: 'scaleIn 0.4s ease 0.2s both' }}
      >
        {type === 'order' ? 'Заказ отправлен!' : 'Возврат оформлен!'}
      </h2>
      <p
        className="text-[14px] text-cream-500 mb-1 text-center"
        style={{ animation: 'scaleIn 0.4s ease 0.25s both' }}
      >
        {type === 'order'
          ? 'Мы уведомим вас о подтверждении'
          : 'Заявка будет рассмотрена'}
      </p>
      {orderNumber && (
        <p
          className="text-[12px] text-cream-400 font-mono mb-8"
          style={{ animation: 'scaleIn 0.4s ease 0.3s both' }}
        >
          #{orderNumber}
        </p>
      )}
      <button
        onClick={onDone}
        className="px-8 py-3.5 rounded-2xl bg-cream-500 text-white text-[14px] font-semibold
                   active:scale-95 transition-transform"
        style={{ animation: 'scaleIn 0.4s ease 0.35s both' }}
      >
        Готово
      </button>
    </div>
  );
}
