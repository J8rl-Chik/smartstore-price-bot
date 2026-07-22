export const DELIVERY_FEE_TYPE = {
  FREE: '무료',
  PAID: '유료',
  UNIT_QUANTITY_PAID: '수량별',
} as const;

export type DeliveryFeeType = (typeof DELIVERY_FEE_TYPE)[keyof typeof DELIVERY_FEE_TYPE];
