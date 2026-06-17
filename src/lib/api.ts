/**
 * API клиент для Mini App бэкенда.
 *
 * Auth: Authorization: tma <initData>
 * Base URL: из VITE_API_URL (.env) или относительный /api/miniapp
 */

const BASE = import.meta.env.VITE_API_URL || '/api/miniapp';

async function request<T>(
  path: string,
  initData: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `tma ${initData}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error ?? `HTTP ${res.status}`) as any;
    err.status = res.status;
    throw err;
  }

  return res.json();
}

// ── Products ──

export async function fetchProducts(initData: string) {
  return request<{
    products: import('@/types').Product[];
    restaurant: string;
    is_retail?: boolean;
  }>('/products', initData);
}

// ── Orders ──

export async function createOrder(
  initData: string,
  items: { product_id: number; quantity: number }[],
  comment: string = '',
  paymentMethod: string = 'cash',
  isRetail: boolean = false,
) {
  return request<import('@/types').OrderResponse>('/orders', initData, {
    method: 'POST',
    body: JSON.stringify({ items, comment, payment_method: paymentMethod, is_retail: isRetail }),
  });
}

export async function fetchOrderHistory(initData: string, limit = 20, offset = 0) {
  return request<{ orders: import('@/types').OrderHistoryItem[] }>(
    `/orders/history?limit=${limit}&offset=${offset}`,
    initData,
  );
}

// ── Returns ──

export async function createReturn(
  initData: string,
  orderId: number,
  items: { product_id: number; quantity: number }[],
  reason: string,
) {
  return request<import('@/types').ReturnResponse>('/returns', initData, {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, items, reason }),
  });
}

export async function fetchReturnHistory(initData: string, limit = 20, offset = 0) {
  return request<{ returns: any[] }>(
    `/returns/history?limit=${limit}&offset=${offset}`,
    initData,
  );
}
