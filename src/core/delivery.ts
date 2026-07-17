import { DELIVERY_FEE_TYPE } from './constant.js';

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
    // TODO: 시트에 '수량별' 칼럼 추가하기(칼럼 상수 정의 필요)
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

  /**
   * feeType이 셋 중 무엇도 아니면 과거엔 deliveryFee가 빈 객체로 남아 사실상 무료 배송으로
   * 처리되는 잠재 버그가 있었음. 조용히 잘못된 배송비로 등록되는 대신 즉시 실패하도록 변경.
   * Delivery가 판별 유니온이라 정상 흐름에서는 여기 도달할 수 없지만(parseProductRow가 미리
   * feeType을 검증함), 타입을 우회해 들어온 외부 입력에 대한 방어선으로 남겨둔다.
   */
  throw new Error('알 수 없는 배송비 유형입니다.');
};
