import { DELIVERY_FEE_TYPE } from './_constant.js';

export type DeliveryFeeType = (typeof DELIVERY_FEE_TYPE)[keyof typeof DELIVERY_FEE_TYPE];

/**
 * ProductRow는 배송 유형과 상관없이 productPrice, baseFee, freeDeliveryPrice를 모두 갖고,
 * parseProductRow에서 배송 유형에 맞는 값으로 채운다. 무료 배송은 baseFee가 0으로 채워져 함께 넘어온다.
 * 무료 배송은 배송비를 쓰지 않아 타입에서는 뺐고, createTargetProducts에서는 feeType이 유니온이라 남는 속성 검사를 통과한다.
 */
interface FreeDelivery {
  feeType: typeof DELIVERY_FEE_TYPE.FREE;
}

interface PaidDelivery {
  feeType: typeof DELIVERY_FEE_TYPE.PAID;
  baseFee: number;
}

interface UnitQuantityPaidDelivery {
  feeType: typeof DELIVERY_FEE_TYPE.UNIT_QUANTITY_PAID;
  baseFee: number;
  repeatQuantity?: number;
}

export type Delivery = FreeDelivery | PaidDelivery | UnitQuantityPaidDelivery;

interface FreeDeliveryFee {
  deliveryFeeType: 'FREE';
}

interface PaidDeliveryFee {
  deliveryFeeType: 'PAID';
  deliveryFeePayType: 'PREPAID';
  baseFee: number;
}

interface UnitQuantityPaidDeliveryFee {
  deliveryFeeType: 'UNIT_QUANTITY_PAID';
  deliveryFeePayType: 'PREPAID';
  repeatQuantity: number | undefined;
  baseFee: number;
}

export type DeliveryFee = FreeDeliveryFee | PaidDeliveryFee | UnitQuantityPaidDeliveryFee;

export interface PriceWithDeliveryFee {
  deliveryFee: DeliveryFee;
  salePrice: number;
}
