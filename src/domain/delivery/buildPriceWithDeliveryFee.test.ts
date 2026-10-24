import { expect, it } from 'vitest';
import { buildPriceWithDeliveryFee } from './buildPriceWithDeliveryFee.js';
import type { Delivery } from './_type.js';
import { ERROR_MESSAGE } from '../error/errorMessage.js';

// baseFee는 parseProductRow 함수에서 검증했으므로, 10의 배수 값이라는 전제로 테스트했습니다.

it('무료 배송이면 deliveryFeeType만 FREE로 설정하고 salePrice는 targetPrice 그대로다', () => {
  const result = buildPriceWithDeliveryFee({ feeType: '무료' }, 10000);

  expect(result).toEqual({
    deliveryFee: { deliveryFeeType: 'FREE' },
    salePrice: 10000,
  });
});

it('무료 배송에 baseFee가 0원으로 들어와도 baseFee 없이 FREE로 설정하고 salePrice는 targetPrice 그대로다', () => {
  const freeDeliveryWithZeroBaseFee = { feeType: '무료', baseFee: 0 } as const;

  const result = buildPriceWithDeliveryFee(freeDeliveryWithZeroBaseFee, 10000);

  expect(result).toEqual({
    deliveryFee: { deliveryFeeType: 'FREE' },
    salePrice: 10000,
  });
});

it('유료 배송이면 baseFee를 포함하고 salePrice에서 baseFee를 뺀다', () => {
  const result = buildPriceWithDeliveryFee({ feeType: '유료', baseFee: 3000 }, 10000);

  expect(result).toEqual({
    deliveryFee: {
      deliveryFeeType: 'PAID',
      deliveryFeePayType: 'PREPAID',
      baseFee: 3000,
    },
    salePrice: 7000,
  });
});

it('수량별 배송이면 repeatQuantity와 baseFee를 포함하고 salePrice에서 baseFee를 뺀다', () => {
  const result = buildPriceWithDeliveryFee(
    { feeType: '수량별', baseFee: 2500, repeatQuantity: 2 },
    10000,
  );

  expect(result).toEqual({
    deliveryFee: {
      deliveryFeePayType: 'PREPAID',
      deliveryFeeType: 'UNIT_QUANTITY_PAID',
      repeatQuantity: 2,
      baseFee: 2500,
    },
    salePrice: 7500,
  });
});

it('알 수 없는 feeType이면 에러를 던진다', () => {
  const invalidDelivery = { feeType: '착불' } as unknown as Delivery;

  expect(() => buildPriceWithDeliveryFee(invalidDelivery, 10000)).toThrow(
    `${ERROR_MESSAGE.UNKNOWN_DELIVERY_FEE_TYPE} (feeType: 착불)`,
  );
});
