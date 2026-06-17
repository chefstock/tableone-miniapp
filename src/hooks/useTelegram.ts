import { useCallback } from 'react';

/**
 * Telegram WebApp SDK helper.
 * В продакшене window.Telegram.WebApp предоставляет initData,
 * haptic feedback, MainButton, BackButton и т.д.
 */

const tg = typeof window !== 'undefined'
  ? (window as any).Telegram?.WebApp
  : null;

export function useTelegram() {
  const initData: string = tg?.initData ?? '';
  const user = tg?.initDataUnsafe?.user ?? null;
  const colorScheme: 'light' | 'dark' = tg?.colorScheme ?? 'light';

  const ready = useCallback(() => {
    tg?.ready();
    tg?.expand();
    tg?.requestFullscreen?.();
  }, []);

  const close = useCallback(() => {
    tg?.close();
  }, []);

  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    tg?.HapticFeedback?.impactOccurred(type);
  }, []);

  const showAlert = useCallback((msg: string) => {
    tg?.showAlert(msg);
  }, []);

  return { tg, initData, user, colorScheme, ready, close, haptic, showAlert };
}
