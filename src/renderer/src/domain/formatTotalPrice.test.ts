import { describe, expect, it } from 'vitest';
import formatTotalPrice from './formatTotalPrice';

describe('formatTotalPrice', () => {
  it('제품가에 배송비를 더한 합계를 원 단위로 만든다', () => {
    expect(formatTotalPrice({ price: 39900, deliveryFee: 3000 })).toBe('42,900원');
  });

  it('배송비가 0이면 제품가를 그대로 보여준다', () => {
    expect(formatTotalPrice({ price: 35000, deliveryFee: 0 })).toBe('35,000원');
  });

  it('천 단위마다 구분 기호를 넣는다', () => {
    expect(formatTotalPrice({ price: 1234567, deliveryFee: 3000 })).toBe('1,237,567원');
  });

  it('천 단위 미만이면 구분 기호 없이 보여준다', () => {
    expect(formatTotalPrice({ price: 500, deliveryFee: 300 })).toBe('800원');
  });
});
