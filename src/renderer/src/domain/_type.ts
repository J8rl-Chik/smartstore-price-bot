export type ProductUpdateStatus = 'wait' | 'complete' | 'error';

// formatTime이 만드는 시:분:초 문자열
export type FormattedTime = `${string}:${string}:${string}`;

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
  // 수정을 시도하기 전이면 "—"
  updateTime: FormattedTime | '—';
}
