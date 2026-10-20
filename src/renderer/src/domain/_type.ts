export type ProductUpdateStatus = 'wait' | 'complete' | 'error';

export interface PriceWithFee {
  price: number;
  deliveryFee: number;
}

export interface TProductTableRow {
  id: number;
  name: string;
  configuredPrice: PriceWithFee;
  currentPrice: PriceWithFee;
  // 수정가가 아직 없으면 null. "—"로 표시한다.
  updatedPrice: PriceWithFee | null;
  status: ProductUpdateStatus;
  updateTime: string;
}
