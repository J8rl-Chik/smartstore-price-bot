import { describe, expect, it } from 'vitest';
import { buildPriceWithDeliveryFee, createDelivery, type Delivery } from './delivery.js';
import type { DeliveryFeeType } from './constant.js';

describe('createDelivery', () => {
  it('무료 배송이면 feeType만 담는다', () => {
    expect(createDelivery({ feeType: '무료', baseFee: 0 })).toEqual({ feeType: '무료' });
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
    // 상위(parseProductRow)에서 feeType을 이미 검증하므로 정상적으로는 발생하지 않지만,
    // 타입을 우회해 들어온 외부 입력에 대한 방어를 검증한다.
    const invalidFeeType = '착불' as unknown as DeliveryFeeType;

    expect(() => createDelivery({ feeType: invalidFeeType, baseFee: 0 })).toThrow(
      '알 수 없는 배송비 유형입니다',
    );
  });
});

describe('buildPriceWithDeliveryFee', () => {
  it('무료 배송이면 deliveryFeeType만 FREE로 설정하고 salePrice는 targetPrice 그대로다', () => {
    const result = buildPriceWithDeliveryFee({ feeType: '무료' }, 10000);

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
    // parseProductRow가 이미 걸러내는 값이라 정상적으로는 발생하지 않지만, 타입을 우회해
    // 들어온 외부 입력에 대한 방어를 검증한다.
    const invalidDelivery = { feeType: '착불' } as unknown as Delivery;

    expect(() => buildPriceWithDeliveryFee(invalidDelivery, 10000)).toThrow(
      '알 수 없는 배송비 유형입니다',
    );
  });
});
