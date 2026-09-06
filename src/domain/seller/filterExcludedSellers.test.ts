import { describe, expect, it } from 'vitest';
import { filterExcludedSellers } from './filterExcludedSellers.js';

describe('filterExcludedSellers', () => {
  const sellers = [
    { name: '내 스토어', price: 10000, deliveryFee: 0, deliveryFeeType: '무료' },
    { name: '제외 판매처', price: 9000, deliveryFee: 0, deliveryFeeType: '무료' },
    { name: '일반 판매처', price: 11000, deliveryFee: 0, deliveryFeeType: '무료' },
  ];

  it('전달받은 이름 목록에 포함된 판매처를 걸러낸다', () => {
    const result = filterExcludedSellers(sellers, ['내 스토어', '제외 판매처']);

    expect(result).toEqual(sellers[2]);
  });

  it('제외할 이름이 없으면 전체 판매처를 그대로 반환한다', () => {
    const result = filterExcludedSellers(sellers, []);

    expect(result).toEqual(sellers);
  });
});
