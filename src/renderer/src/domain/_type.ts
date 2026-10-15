import type { TargetProduct } from '../../../domain/product/_type';

/**
 * 가격 수정 상태에 따라 가진 값이 달라서 status로 구분하는 유니온으로 둔다.
 * price: 배송비를 제외한 수정 판매가, updatedAt: 수정(또는 실패)한 시각의 타임스탬프(ms)
 */
export type TargetProductUpdate =
  | { status: 'wait' }
  | { status: 'complete'; price: number; baseFee: number; updatedAt: number }
  | { status: 'error'; updatedAt: number };

export interface TargetProductWithUpdate extends TargetProduct {
  update: TargetProductUpdate;
}

export type ProductUpdateStatus = 'wait' | 'complete' | 'error';

export interface PriceWithFee {
  price: number;
  deliveryFee: number;
}

export interface ProductListItem {
  id: number;
  name: string;
  setPrice: PriceWithFee;
  currentPrice: PriceWithFee;
  // 수정가가 아직 없으면 null. "—"로 표시한다.
  updatedPrice: PriceWithFee | null;
  status: ProductUpdateStatus;
  updatedAt: string;
}
