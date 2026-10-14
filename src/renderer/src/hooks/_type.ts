import type { TargetProduct } from '../../../domain/product/_type';

/**
 * 가격 수정 상태에 따라 가진 값이 달라서 status로 구분하는 유니온으로 둔다.
 * price: 배송비를 포함한 수정가 합계, updatedAt: 수정(또는 실패)한 시각의 타임스탬프(ms)
 */
export type TargetProductUpdate =
  | { status: 'wait' }
  | { status: 'done'; price: number; baseFee: number | undefined; updatedAt: number }
  | { status: 'error'; updatedAt: number };

export interface TargetProductWithUpdate extends TargetProduct {
  update: TargetProductUpdate;
}
