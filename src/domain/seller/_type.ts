import type { DeliveryFeeType } from '../delivery/_type.js';

export interface Seller {
  name: string;
  price: number;
  deliveryFee: number;
  // 가격비교 페이지는 수량별 배송비를 구분해 보여주지 않아 무료/유료만 들어온다.
  deliveryFeeType: Exclude<DeliveryFeeType, '수량별'>;
}
