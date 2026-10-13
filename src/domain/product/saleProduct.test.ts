import { describe, expect, it } from 'vitest';
import {
  excludeNewlyRegisteredProducts,
  getDeliveryFee,
  getOriginProductNo,
  getProductName,
  getSalePrice,
  getStockQuantity,
  isNewlyRegisteredProduct,
} from './saleProduct.js';
import type { ProductChannel, SaleProduct } from './_type.js';

const createSaleProduct = (productChannel: Partial<ProductChannel>): SaleProduct => ({
  channelProducts: [
    {
      name: '테스트 상품',
      originProductNo: 12345,
      salePrice: 10000,
      stockQuantity: 10,
      deliveryFee: 3000,
      ...productChannel,
    },
  ],
});

describe('getProductName', () => {
  it('channelProducts[0]의 name을 반환한다', () => {
    const name = '무선 이어폰';
    const saleProduct = createSaleProduct({ name });

    expect(getProductName(saleProduct)).toBe(name);
  });
});

describe('getOriginProductNo', () => {
  it('channelProducts[0]의 originProductNo를 반환한다', () => {
    const originProductNo = 98765;
    const saleProduct = createSaleProduct({ originProductNo });

    expect(getOriginProductNo(saleProduct)).toBe(originProductNo);
  });
});

describe('getSalePrice', () => {
  it('channelProducts[0]의 salePrice를 반환한다', () => {
    const salePrice = 42900;
    const saleProduct = createSaleProduct({ salePrice });

    expect(getSalePrice(saleProduct)).toBe(salePrice);
  });
});

describe('getStockQuantity', () => {
  it('channelProducts[0]의 stockQuantity를 반환한다', () => {
    const stockQuantity = 25;
    const saleProduct = createSaleProduct({ stockQuantity });

    expect(getStockQuantity(saleProduct)).toBe(stockQuantity);
  });

  it('재고가 0이면 0을 반환한다', () => {
    const saleProduct = createSaleProduct({ stockQuantity: 0 });

    expect(getStockQuantity(saleProduct)).toBe(0);
  });
});

describe('getDeliveryFee', () => {
  it('channelProducts[0]의 deliveryFee를 반환한다', () => {
    const deliveryFee = 2500;
    const saleProduct = createSaleProduct({ deliveryFee });

    expect(getDeliveryFee(saleProduct)).toBe(deliveryFee);
  });

  it('무료배송이면 0을 반환한다', () => {
    const saleProduct = createSaleProduct({ deliveryFee: 0 });

    expect(getDeliveryFee(saleProduct)).toBe(0);
  });
});

describe('isNewlyRegisteredProduct', () => {
  it('sellerManagementCode에 "신규"가 포함되면 true를 반환한다', () => {
    const saleProduct = createSaleProduct({ sellerManagementCode: '신규' });

    expect(isNewlyRegisteredProduct(saleProduct)).toBe(true);
  });

  it('sellerManagementCode에 "a.신규 묶음"이 포함되면 true를 반환한다', () => {
    const saleProduct = createSaleProduct({ sellerManagementCode: 'a.신규 묶음' });

    expect(isNewlyRegisteredProduct(saleProduct)).toBe(true);
  });

  it('sellerManagementCode에 "신규"가 없으면 false를 반환한다', () => {
    const saleProduct = createSaleProduct({ sellerManagementCode: '새 상품' });

    expect(isNewlyRegisteredProduct(saleProduct)).toBe(false);
  });

  it('sellerManagementCode가 없으면 false를 반환한다', () => {
    const saleProduct = createSaleProduct({ sellerManagementCode: undefined });

    expect(isNewlyRegisteredProduct(saleProduct)).toBe(false);
  });

  it('sellerManagementCode가 빈 문자열("")이면 false를 반환한다', () => {
    const saleProduct = createSaleProduct({ sellerManagementCode: '' });

    expect(isNewlyRegisteredProduct(saleProduct)).toBe(false);
  });
});

describe('에러: channelProducts가 비어 있는 경우', () => {
  const emptySaleProduct: SaleProduct = { channelProducts: [] };

  it('getProductName 호출 시 에러를 던진다', () => {
    expect(() => getProductName(emptySaleProduct)).toThrow('channelProducts가 비어 있습니다');
  });

  it('getOriginProductNo 호출 시 에러를 던진다', () => {
    expect(() => getOriginProductNo(emptySaleProduct)).toThrow('channelProducts가 비어 있습니다');
  });

  it('getSalePrice 호출 시 에러를 던진다', () => {
    expect(() => getSalePrice(emptySaleProduct)).toThrow('channelProducts가 비어 있습니다');
  });

  it('getStockQuantity 호출 시 에러를 던진다', () => {
    expect(() => getStockQuantity(emptySaleProduct)).toThrow('channelProducts가 비어 있습니다');
  });

  it('getDeliveryFee 호출 시 에러를 던진다', () => {
    expect(() => getDeliveryFee(emptySaleProduct)).toThrow('channelProducts가 비어 있습니다');
  });

  it('isNewlyRegisteredProduct 호출 시 에러를 던진다', () => {
    expect(() => isNewlyRegisteredProduct(emptySaleProduct)).toThrow(
      'channelProducts가 비어 있습니다',
    );
  });
});

describe('excludeNewlyRegisteredProducts', () => {
  it("'신규' 코드가 포함된 상품을 제외한 나머지 상품들을 배열을 반환한다", () => {
    const newProduct1 = createSaleProduct({ sellerManagementCode: '신규' });
    const newProduct2 = createSaleProduct({ sellerManagementCode: 'a.신규 묶음' });
    const existingProduct = createSaleProduct({ sellerManagementCode: '기존 상품' });

    expect(excludeNewlyRegisteredProducts([newProduct1, newProduct2, existingProduct])).toEqual([
      existingProduct,
    ]);
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(excludeNewlyRegisteredProducts([])).toEqual([]);
  });
});
