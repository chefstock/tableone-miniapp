export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  price: number;
  photo_url: string | null;
  min_order: number;
  in_stock: boolean;
}

export interface CartItem {
  product_id: number;
  quantity: number;
}

export interface OrderResponse {
  order_id: number;
  order_number: string;
  total: number;
  items_count: number;
  created_at: string;
}

export interface ReturnResponse {
  return_id: number;
  order_id: number;
  total_amount: number;
  items_count: number;
  created_at: string;
}

export interface OrderHistoryItem {
  id: number;
  order_number: string;
  status: string;
  total: number;
  payment_method: string;
  notes: string | null;
  items: { product_id: number; name: string; qty: number; price: number; total: number }[];
  created_at: string;
}

export type ReturnReason =
  | 'defect'
  | 'wrong_item'
  | 'quality'
  | 'overstock'
  | 'other';

export const RETURN_REASONS: Record<ReturnReason, string> = {
  defect: 'Брак / повреждение',
  wrong_item: 'Не тот товар',
  quality: 'Не устроило качество',
  overstock: 'Излишки',
  other: 'Другое',
};
