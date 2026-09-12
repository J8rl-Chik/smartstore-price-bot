import updatePrice from './updatePrice.js';
import isManualTestRun from '../../utils/isManualTestRun.js';
import { buildPriceWithDeliveryFee } from '../../domain/delivery/delivery.js';

if (isManualTestRun(import.meta.url)) {
  console.log('updatePrice 함수 테스트: 클린 웜 코튼 오 드 퍼퓸 60ml 20만원으로 수정');

  const { deliveryFee, salePrice } = buildPriceWithDeliveryFee(
    // { feeType: '수량별', baseFee: 3000, repeatQuantity: 20 },
    { feeType: '유료', baseFee: 3000 },
    // { feeType: '무료' },
    200000,
  );

  updatePrice({
    productNo: 12646660788, // 클린 웜 코튼 오 드 퍼퓸 60ml
    deliveryFee,
    salePrice,
  });
}
