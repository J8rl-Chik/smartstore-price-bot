import { DELIVERY_FEE_TYPE } from './constant.js';

export const buildPriceWithDeliveryFee = (delivery, targetPrice) => {
  // TODO: 현재는 조건문으로 처리하고 있지만 리팩토링 시 팩토리(Factory) + 전략(Strategy) 패턴 고려.
  if (delivery.feeType === DELIVERY_FEE_TYPE.FREE) {
    return { deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: targetPrice };
  }

  if (delivery.feeType === DELIVERY_FEE_TYPE.PAID) {
    return {
      deliveryFee: {
        deliveryFeeType: 'PAID',
        deliveryFeePayType: 'PREPAID',
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
   */
  throw new Error(`알 수 없는 배송비 유형입니다: "${delivery.feeType}"`);
};
