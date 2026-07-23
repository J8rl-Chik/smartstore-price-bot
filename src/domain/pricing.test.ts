import { describe, expect, it } from 'vitest';
import { calculateTargetPrice, isUpdateRequired } from './pricing.js';

describe('calculateTargetPrice', () => {
  it('freeDeliveryPrice + 10 이상인 최저가보다 10원 낮은 가격을 반환한다', () => {
    expect(calculateTargetPrice([9000, 11000, 15000], 10000)).toBe(10990);
  });

  it('정렬되지 않은 목록이 주어져도 최저가 기준으로 계산한다', () => {
    expect(calculateTargetPrice([15000, 9000, 11000], 10000)).toBe(10990);
  });

  it('조건을 만족하는 가격이 없으면 freeDeliveryPrice를 그대로 반환한다', () => {
    expect(calculateTargetPrice([9000, 9500], 10000)).toBe(10000);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const prices = [15000, 9000, 11000];
    const original = [...prices];

    calculateTargetPrice(prices, 10000);

    expect(prices).toEqual(original);
  });
});

describe('isUpdateRequired', () => {
  // 가격비교 페이지에서 가격이 순위권에서 밀려나면 currentMyStore는 undefined
  it('판매처들 중 현재 내 판매처가 없으면 갱신 필요(true)를 반환한다', () => {
    const sellers = [{ name: '다른 판매처', price: 9000, deliveryFeeType: '무료' }];
    const currentMyStore = sellers.find(({ name }) => name === '내 스토어');

    expect(isUpdateRequired(currentMyStore, 10000, '무료')).toBe(true);
  });

  it('targetPrice가 다르면 true를 반환한다', () => {
    const currentMyStore = { price: 9000, deliveryFeeType: 'FREE' };

    expect(isUpdateRequired(currentMyStore, 10000, 'FREE')).toBe(true);
  });

  it('feeType이 다르면 true를 반환한다', () => {
    const currentMyStore = { price: 10000, deliveryFeeType: 'FREE' };

    expect(isUpdateRequired(currentMyStore, 10000, 'PAID')).toBe(true);
  });

  it('가격과 feeType이 모두 같으면 false를 반환한다', () => {
    const currentMyStore = { price: 10000, deliveryFeeType: 'FREE' };

    expect(isUpdateRequired(currentMyStore, 10000, 'FREE')).toBe(false);
  });
});
