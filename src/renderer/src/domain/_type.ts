export type ProductUpdateStatus = 'wait' | 'complete' | 'error';

/**
 * parseRestartDelay가 재실행 간격 입력을 검사한 결과.
 * 입력이 비어 있으면 자동 재실행 없이 한 번만 순회하도록 restartDelayMinutes가 null이다.
 */
export type ParsedRestartDelay =
  { isValid: true; restartDelayMinutes: number | null } | { isValid: false; errorMessage: string };

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
  // 수정에 실패(error)했을 때만 있는 실패 이유. 그 외 상태이면 null
  errorMessage: string | null;
  // 수정을 시도하기 전이면 "—"
  updateTime: FormattedTime | '—';
}
