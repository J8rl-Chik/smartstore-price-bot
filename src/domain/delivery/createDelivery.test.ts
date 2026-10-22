import { expect, it } from 'vitest';
import { createDelivery } from './createDelivery.js';
import type { DeliveryFeeType } from './_type.js';
import { ERROR_MESSAGE } from '../error/errorMessage.js';

// baseFee는 parseProductRow 함수에서 검증했으므로, 10의 배수 값이라는 전제로 테스트했습니다.

it('무료 배송이이고 feeType만 담는다', () => {
  expect(createDelivery({ feeType: '무료', baseFee: 0 })).toEqual({ feeType: '무료' });
});

it('무료 배송이면 배송비가 1000원이어도 feeType만 담는다', () => {
  expect(createDelivery({ feeType: '무료', baseFee: 1000 })).toEqual({ feeType: '무료' });
});

it('유료 배송이면 feeType과 baseFee를 담는다', () => {
  expect(createDelivery({ feeType: '유료', baseFee: 3000 })).toEqual({
    feeType: '유료',
    baseFee: 3000,
  });
});

it('수량별 배송이면 feeType과 baseFee를 담는다', () => {
  expect(createDelivery({ feeType: '수량별', baseFee: 2500 })).toEqual({
    feeType: '수량별',
    baseFee: 2500,
  });
});

it('알 수 없는 feeType이면 에러를 던진다', () => {
  const invalidFeeType = '착불' as unknown as DeliveryFeeType;

  expect(() => createDelivery({ feeType: invalidFeeType, baseFee: 0 })).toThrow(
    `${ERROR_MESSAGE.UNKNOWN_DELIVERY_FEE_TYPE} (feeType: 착불)`,
  );
});
