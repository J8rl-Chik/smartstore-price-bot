// TODO: feeType이 "무료"/"유료"/"수량별" 중 어느 것도 아니면 deliveryFee가 빈 객체로 남아
// 사실상 무료 배송으로 처리됨. 현재는 기존 동작을 그대로 보존, 수정 여부는 별도 논의 후 결정.
export const buildDeliveryFeePayload = (delivery, targetPrice) => {
  const deliveryFee = {};
  let salePrice = targetPrice;

  if (delivery.feeType === '무료') {
    deliveryFee.deliveryFeeType = 'FREE';
  } else if (delivery.feeType === '유료') {
    deliveryFee.deliveryFeeType = 'PAID';
    deliveryFee.deliveryFeePayType = 'PREPAID';
    deliveryFee.baseFee = delivery.baseFee;
    salePrice = targetPrice - delivery.baseFee;
  } else if (delivery.feeType === '수량별') {
    deliveryFee.deliveryFeePayType = 'PREPAID';
    deliveryFee.deliveryFeeType = 'UNIT_QUANTITY_PAID';
    deliveryFee.repeatQuantity = delivery.repeatQuantity;
    deliveryFee.baseFee = delivery.baseFee;
    salePrice = targetPrice - delivery.baseFee;
  }

  return { deliveryFee, salePrice };
};
