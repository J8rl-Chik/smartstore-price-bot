// invalid: 시트 값이 잘못되어 가격 수정 대상에서 빠진 상품
export type ProductUpdateStatus = 'wait' | 'complete' | 'error' | 'invalid';

// formatTime이 만드는 시:분:초 문자열
export type FormattedTime = `${string}:${string}:${string}`;

export interface PriceWithFee {
  price: number;
  deliveryFee: number;
}

export interface TProductTableRow {
  id: number;
  name: string;
  // 시트 값이 잘못되어(invalid) 설정가를 만들 수 없으면 null. "—"로 표시한다.
  configuredPrice: PriceWithFee | null;
  currentPrice: PriceWithFee;
  // 수정가가 아직 없으면 null. "—"로 표시한다.
  updatedPrice: PriceWithFee | null;
  status: ProductUpdateStatus;
  // 수정에 실패(error)했거나 시트 값이 잘못되었을(invalid) 때만 있는 이유. 그 외 상태이면 null
  errorMessages: string[] | null;
  // 수정을 시도하기 전이면 "—"
  updateTime: FormattedTime | '—';
}
