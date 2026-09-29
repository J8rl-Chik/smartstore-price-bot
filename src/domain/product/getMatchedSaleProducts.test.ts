import { describe, expect, it } from 'vitest';
import { getMatchedSaleProducts } from './getMatchedSaleProducts.js';
import { DELIVERY_FEE_TYPE } from '../delivery/delivery.js';
import type { SaleProduct } from './saleProduct.js';
import type { ProductRow, ProductRowsResponse, SaleProductsResponse } from './_type.js';

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

const createSuccessSaleProductsResponse = (saleProducts: SaleProduct[]): SaleProductsResponse => ({
  isSuccess: true,
  saleProducts,
});

const createFailureSaleProductsResponse = (): SaleProductsResponse => ({
  isSuccess: false,
  error: '네이버 판매 상품 목록을 가져오지 못했습니다.',
});

const createSuccessProductRowsResponse = (productRows: ProductRow[]): ProductRowsResponse => ({
  isSuccess: true,
  productRows,
});

const createFailureProductRowsResponse = (): ProductRowsResponse => ({
  isSuccess: false,
  error: 'Google Sheets에서 상품 목록을 가져오지 못했습니다.',
});

describe('getMatchedSaleProducts', () => {
  it('두 응답이 모두 성공이면 제품명이 일치하는 saleProduct만 모아 반환한다', () => {
    const matched = createSaleProduct('무선 이어폰');
    const unmatched = createSaleProduct('블루투스 스피커');
    const saleProductsResponse = createSuccessSaleProductsResponse([matched, unmatched]);
    const productRowsResponse = createSuccessProductRowsResponse([createProductRow('무선 이어폰')]);

    expect(getMatchedSaleProducts(saleProductsResponse, productRowsResponse)).toEqual([matched]);
  });

  it('saleProductsResponse가 실패면 null을 반환한다', () => {
    const saleProductsResponse = createFailureSaleProductsResponse();
    const productRowsResponse = createSuccessProductRowsResponse([createProductRow('무선 이어폰')]);

    expect(getMatchedSaleProducts(saleProductsResponse, productRowsResponse)).toBeNull();
  });

  it('productRowsResponse가 실패면 null을 반환한다', () => {
    const saleProductsResponse = createSuccessSaleProductsResponse([
      createSaleProduct('무선 이어폰'),
    ]);
    const productRowsResponse = createFailureProductRowsResponse();

    expect(getMatchedSaleProducts(saleProductsResponse, productRowsResponse)).toBeNull();
  });

  it('saleProductsResponse가 null이면 null을 반환한다', () => {
    const productRowsResponse = createSuccessProductRowsResponse([createProductRow('무선 이어폰')]);

    expect(getMatchedSaleProducts(null, productRowsResponse)).toBeNull();
  });

  it('productRowsResponse가 null이면 null을 반환한다', () => {
    const saleProductsResponse = createSuccessSaleProductsResponse([
      createSaleProduct('무선 이어폰'),
    ]);

    expect(getMatchedSaleProducts(saleProductsResponse, null)).toBeNull();
  });
});
