import { expect, it } from 'vitest';
import { isPriceUpdateRequired } from './isPriceUpdateRequired.js';

it('판매처들 중 현재 내 판매처가 없으면 갱신 필요(true)를 반환한다', () => {
  const sellers = [{ name: '다른 판매처', price: 9000, deliveryFeeType: '무료' as const }];
  const currentMyStore = sellers.find(({ name }) => name === '내 스토어');

  expect(isPriceUpdateRequired(currentMyStore, 10000, '무료')).toBe(true);
});

it('targetPrice가 다르면 true를 반환한다', () => {
  const currentMyStore = { price: 9000, deliveryFeeType: '무료' } as const;

  expect(isPriceUpdateRequired(currentMyStore, 10000, '무료')).toBe(true);
});

it('feeType이 다르면 true를 반환한다', () => {
  const currentMyStore = { price: 10000, deliveryFeeType: '무료' } as const;

  expect(isPriceUpdateRequired(currentMyStore, 10000, '유료')).toBe(true);
});

it('가격과 feeType이 모두 같으면 false를 반환한다', () => {
  const currentMyStore = { price: 10000, deliveryFeeType: '무료' } as const;

  expect(isPriceUpdateRequired(currentMyStore, 10000, '무료')).toBe(false);
});

it('가격과 feeType이 모두 다르면 true를 반환한다', () => {
  const currentMyStore = { price: 9000, deliveryFeeType: '유료' } as const;

  expect(isPriceUpdateRequired(currentMyStore, 10000, '무료')).toBe(true);
});
