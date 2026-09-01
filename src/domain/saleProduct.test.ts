import { describe, expect, it } from 'vitest';
import {
  excludeNewlyRegisteredProducts,
  getOriginProductNo,
  getProductName,
  isNewlyRegisteredProduct,
  type SaleProduct,
  type ProductChannel,
} from './saleProduct.js';

const createSaleProduct = (productChannel: Partial<ProductChannel>): SaleProduct => ({
  channelProducts: [
    {
      name: '테스트 상품',
      originProductNo: 12345,
      sellerManagementCode: undefined,
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

describe('channelProducts가 비어 있는 경우', () => {
  const emptySaleProduct: SaleProduct = { channelProducts: [] };

  it('getProductName 호출 시 에러를 던진다', () => {
    expect(() => getProductName(emptySaleProduct)).toThrow('channelProducts가 비어 있습니다');
  });

  it('getOriginProductNo 호출 시 에러를 던진다', () => {
    expect(() => getOriginProductNo(emptySaleProduct)).toThrow('channelProducts가 비어 있습니다');
  });

  it('isNewlyRegisteredProduct 호출 시 에러를 던진다', () => {
    expect(() => isNewlyRegisteredProduct(emptySaleProduct)).toThrow(
      'channelProducts가 비어 있습니다',
    );
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
