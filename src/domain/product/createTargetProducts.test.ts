import { describe, expect, it } from 'vitest';
import { createTargetProducts } from './createTargetProducts.js';
import { DELIVERY_FEE_TYPE } from '../delivery/delivery.js';
import type { ProductRow, SaleProduct } from './_type.js';

const createSaleProduct = (name: string, originProductNo = 12345): SaleProduct => ({
  channelProducts: [{ name, originProductNo, sellerManagementCode: '관리코드' }],
});

const createProductRow = (name: string, productPrice = 0): ProductRow => ({
  name,
  catalogURL: 'https://example.com',
  activate: 'TRUE',
  feeType: DELIVERY_FEE_TYPE.FREE,
  freeDeliveryPrice: 30000,
  productPrice,
  baseFee: 3000,
  virtualPrice: null,
  excludedSellerNames: ['제외 판매처'],
});

describe('createTargetProducts', () => {
  it('이름이 일치하는 saleProduct와 productRow를 TargetProduct 하나로 합친다', () => {
    const saleProducts = [createSaleProduct('무선 이어폰', 111)];
    const productRows = [createProductRow('무선 이어폰', 10000)];

    expect(createTargetProducts(saleProducts, productRows)).toEqual([
      {
        name: '무선 이어폰',
        originProductNo: 111,
        catalogURL: 'https://example.com',
        feeType: DELIVERY_FEE_TYPE.FREE,
        freeDeliveryPrice: 30000,
        productPrice: 10000,
        baseFee: 3000,
        virtualPrice: null,
        excludedSellerNames: ['제외 판매처'],
      },
    ]);
  });

  it('일치하는 productRow가 없는 saleProduct는 결과에서 제외한다', () => {
    const saleProducts = [createSaleProduct('무선 이어폰'), createSaleProduct('블루투스 스피커')];
    const productRows = [createProductRow('무선 이어폰')];

    const result = createTargetProducts(saleProducts, productRows);

    expect(result.map(({ name }) => name)).toEqual(['무선 이어폰']);
  });

  it('saleProducts의 순서를 유지한다', () => {
    const saleProducts = [createSaleProduct('블루투스 스피커'), createSaleProduct('무선 이어폰')];
    const productRows = [createProductRow('무선 이어폰'), createProductRow('블루투스 스피커')];

    const result = createTargetProducts(saleProducts, productRows);

    expect(result.map(({ name }) => name)).toEqual(['블루투스 스피커', '무선 이어폰']);
  });

  it('같은 이름의 productRow가 여러 개면 첫 번째 행을 사용한다', () => {
    const saleProducts = [createSaleProduct('무선 이어폰')];
    const productRows = [
      createProductRow('무선 이어폰', 10000),
      createProductRow('무선 이어폰', 20000),
    ];

    const result = createTargetProducts(saleProducts, productRows);

    expect(result.map(({ productPrice }) => productPrice)).toEqual([10000]);
  });

  it('activate와 sellerManagementCode는 결과에 포함하지 않는다', () => {
    const saleProducts = [createSaleProduct('무선 이어폰')];
    const productRows = [createProductRow('무선 이어폰')];

    const [targetProduct] = createTargetProducts(saleProducts, productRows);

    expect(targetProduct).not.toHaveProperty('activate');
    expect(targetProduct).not.toHaveProperty('sellerManagementCode');
  });

  it('productRows가 빈 배열이면 빈 배열을 반환한다', () => {
    expect(createTargetProducts([createSaleProduct('무선 이어폰')], [])).toEqual([]);
  });

  it('saleProducts가 빈 배열이면 빈 배열을 반환한다', () => {
    expect(createTargetProducts([], [createProductRow('무선 이어폰')])).toEqual([]);
  });
});
