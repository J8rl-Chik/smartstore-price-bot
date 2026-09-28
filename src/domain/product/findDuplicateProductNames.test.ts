import { describe, expect, it } from 'vitest';
import { findDuplicateProductNames } from './findDuplicateProductNames.js';
import { DELIVERY_FEE_TYPE } from '../delivery/delivery.js';
import type { ProductRow } from './_type.js';

const createProductRow = (name: string): ProductRow => ({
  name,
  catalogURL: 'https://example.com',
  activate: 'TRUE',
  feeType: DELIVERY_FEE_TYPE.FREE,
  freeDeliveryPrice: 0,
  productPrice: 0,
  baseFee: 0,
  virtualPrice: null,
  excludedSellerNames: [],
});

describe('findDuplicateProductNames', () => {
  it('2번 이상 등장한 이름만 모아 반환한다', () => {
    const productRows = [
      createProductRow('무선 이어폰'),
      createProductRow('블루투스 스피커'),
      createProductRow('무선 이어폰'),
    ];

    expect(findDuplicateProductNames(productRows)).toEqual(['무선 이어폰']);
  });

  it('중복된 이름이 없으면 빈 배열을 반환한다', () => {
    const productRows = [createProductRow('무선 이어폰'), createProductRow('블루투스 스피커')];

    expect(findDuplicateProductNames(productRows)).toEqual([]);
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(findDuplicateProductNames([])).toEqual([]);
  });

  it('같은 이름이 3번 이상 등장해도 한 번만 반환한다', () => {
    const productRows = [
      createProductRow('무선 이어폰'),
      createProductRow('무선 이어폰'),
      createProductRow('무선 이어폰'),
    ];

    expect(findDuplicateProductNames(productRows)).toEqual(['무선 이어폰']);
  });
});
