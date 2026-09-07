import type { Delivery, DeliveryFeeType, PriceWithDeliveryFee } from './_type.js';

export const DELIVERY_FEE_TYPE = {
  FREE: '무료',
  PAID: '유료',
  UNIT_QUANTITY_PAID: '수량별',
} as const;

export const createDelivery = ({
  feeType,
  baseFee,
}: {
  feeType: DeliveryFeeType;
  baseFee: number;
}): Delivery => {
  if (feeType === DELIVERY_FEE_TYPE.FREE) {
    return { feeType };
  }

  if (feeType === DELIVERY_FEE_TYPE.PAID) {
    return { feeType, baseFee };
  }

  if (feeType === DELIVERY_FEE_TYPE.UNIT_QUANTITY_PAID) {
    return { feeType, baseFee };
  }

  throw new Error('알 수 없는 배송비 유형입니다.');
};

export const buildPriceWithDeliveryFee = (
  delivery: Delivery,
  targetPrice: number,
): PriceWithDeliveryFee => {
  // TODO: 현재는 조건문으로 처리하고 있지만 리팩토링 시 팩토리(Factory) + 전략(Strategy) 패턴 고려.
  if (delivery.feeType === DELIVERY_FEE_TYPE.FREE) {
    return { deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: targetPrice };
  }

  if (delivery.feeType === DELIVERY_FEE_TYPE.PAID) {
    return {
      deliveryFee: {
        deliveryFeePayType: 'PREPAID',
        deliveryFeeType: 'PAID',
        baseFee: delivery.baseFee,
      },
      salePrice: targetPrice - delivery.baseFee,
    };
  }

  if (delivery.feeType === DELIVERY_FEE_TYPE.UNIT_QUANTITY_PAID) {
    // TODO: 시트에 '수량별' 칼럼 추가하기
    return {
      deliveryFee: {
        deliveryFeePayType: 'PREPAID',
        deliveryFeeType: 'UNIT_QUANTITY_PAID',
        repeatQuantity: delivery.repeatQuantity,
        baseFee: delivery.baseFee,
      },
      salePrice: targetPrice - delivery.baseFee,
    };
  }

  throw new Error('알 수 없는 배송비 유형입니다.');
};
