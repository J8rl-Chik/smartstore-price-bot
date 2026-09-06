import { describe, expect, it } from 'vitest';
import { addVirtualPrice } from './addVirtualPrice.js';

describe('addVirtualPrice', () => {
  const prices = [11000, 9000];

  it('virtualPrice가 있으면 가격 목록에 추가한다', () => {
    expect(addVirtualPrice(prices, 5000)).toEqual([...prices, 5000]);
  });

  it('virtualPrice가 null이면 추가하지 않는다', () => {
    expect(addVirtualPrice(prices, null)).toEqual(prices);
  });

  it('원본 배열을 변경하지 않는다', () => {
    addVirtualPrice(prices, 5000);

    expect(prices).toEqual([11000, 9000]);
  });
});
