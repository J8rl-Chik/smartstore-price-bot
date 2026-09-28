import { describe, expect, it } from 'vitest';
import { filterMatchedSaleProducts } from './filterMatchedSaleProducts.js';
import { DELIVERY_FEE_TYPE } from '../delivery/delivery.js';
import type { SaleProduct } from './saleProduct.js';
import type { ProductRow } from './_type.js';

const createSaleProduct = (name: string): SaleProduct => ({
  channelProducts: [{ name, originProductNo: 12345 }],
});

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

describe('filterMatchedSaleProducts', () => {
  it('제품명이 일치하는 saleProduct만 모아 반환한다', () => {
    const matched = createSaleProduct('무선 이어폰');
    const unmatched = createSaleProduct('블루투스 스피커');
    const productRows = [createProductRow('무선 이어폰')];

    expect(filterMatchedSaleProducts([matched, unmatched], productRows)).toEqual([matched]);
  });

  it('일치하는 이름이 없으면 빈 배열을 반환한다', () => {
    const saleProducts = [createSaleProduct('무선 이어폰')];
    const productRows = [createProductRow('블루투스 스피커')];

    expect(filterMatchedSaleProducts(saleProducts, productRows)).toEqual([]);
  });

  it('productRows가 빈 배열이면 빈 배열을 반환한다', () => {
    const saleProducts = [createSaleProduct('무선 이어폰')];

    expect(filterMatchedSaleProducts(saleProducts, [])).toEqual([]);
  });
});
