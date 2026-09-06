import { DELIVERY_FEE_TYPE } from './delivery.js';

export type DeliveryFeeType = (typeof DELIVERY_FEE_TYPE)[keyof typeof DELIVERY_FEE_TYPE];

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
