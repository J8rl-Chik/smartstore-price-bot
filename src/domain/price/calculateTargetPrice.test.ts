import { expect, it } from 'vitest';
import { calculateTargetPrice } from './calculateTargetPrice.js';

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
