import { describe, expect, it } from 'vitest';
import { addVirtualPrice, filterExcludedSellers } from './sellers.js';

describe('filterExcludedSellers', () => {
  const sellers = [
    { name: '내 스토어', price: 10000, deliveryFee: 0, deliveryFeeType: '무료' },
    { name: '제외 판매처', price: 9000, deliveryFee: 0, deliveryFeeType: '무료' },
    { name: '일반 판매처', price: 11000, deliveryFee: 0, deliveryFeeType: '무료' },
  ];

  it('전달받은 이름 목록에 포함된 판매처를 걸러낸다', () => {
    const result = filterExcludedSellers(sellers, ['내 스토어', '제외 판매처']);

    expect(result).toEqual([
      { name: '일반 판매처', price: 11000, deliveryFee: 0, deliveryFeeType: '무료' },
    ]);
  });

  it('제외할 이름이 없으면 전체 판매처를 그대로 반환한다', () => {
    const result = filterExcludedSellers(sellers, []);

    expect(result).toEqual(sellers);
  });
});

describe('addVirtualPrice', () => {
  const prices = [11000, 9000];

  it('virtualPrice가 있으면 가격 목록에 추가한다', () => {
    expect(addVirtualPrice(prices, 5000)).toEqual([...prices, 5000]);
  });

  // virtualPrice는 parseProductRow에서 ''(빈 문자열)이면 null로 변환되어 넘어옴.
  it('virtualPrice가 null이면 추가하지 않는다', () => {
    expect(addVirtualPrice(prices, null)).toEqual(prices);
  });

  it('원본 배열을 변경하지 않는다', () => {
    addVirtualPrice(prices, 5000);

    expect(prices).toEqual([11000, 9000]);
  });
});
