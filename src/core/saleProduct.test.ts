import { describe, expect, it } from 'vitest';
import {
  getOriginProductNo,
  getProductName,
  type SaleProduct,
  type ProductChannel,
} from './saleProduct.js';

const createSaleProduct = (productChannel: Partial<ProductChannel>): SaleProduct => ({
  channelProducts: [
    {
      name: '테스트 상품',
      originProductNo: 12345,
      ...productChannel,
    },
  ],
});

describe('getProductName', () => {
  it('channelProducts[0]의 name을 반환한다', () => {
    const saleProduct = createSaleProduct({ name: '무선 이어폰' });

    expect(getProductName(saleProduct)).toBe('무선 이어폰');
  });
});

describe('getOriginProductNo', () => {
  it('channelProducts[0]의 originProductNo를 반환한다', () => {
    const saleProduct = createSaleProduct({ originProductNo: 98765 });

    expect(getOriginProductNo(saleProduct)).toBe(98765);
  });
});
