import { describe, expect, it } from 'vitest';
import { parseToProductTableRow } from './parseToProductTableRow';
import { DELIVERY_FEE_TYPE } from '../../../domain/delivery/delivery';
import type { TargetProductWithUpdate } from '../../../domain/product/_type';

const createProduct = (
  overrides: Partial<TargetProductWithUpdate> = {},
): TargetProductWithUpdate => ({
  name: '무선 이어폰 프로',
  originProductNo: 111,
  store: { salePrice: 30000, stockQuantity: 10, deliveryFee: 2500 },
  sheet: {
    catalogURL: 'https://catalog.example/1',
    delivery: { feeType: DELIVERY_FEE_TYPE.PAID, baseFee: 3000 },
    freeDeliveryPrice: 50000,
    productPrice: 39900,
    virtualPrice: null,
    excludedSellerNames: [],
  },
  update: { status: 'wait' },
  ...overrides,
});

it('originProductNo를 id로, 이름을 그대로 가져온다', () => {
  const result = parseToProductTableRow(createProduct());

  expect(result.id).toBe(111);
  expect(result.name).toBe('무선 이어폰 프로');
});

it('시트의 배송비 유형이 유료이면 설정가는 제품가와 기본 배송비를 담는다', () => {
  const result = parseToProductTableRow(createProduct());

  expect(result.configuredPrice).toEqual({ price: 39900, deliveryFee: 3000 });
});

it('시트의 배송비 유형이 수량별 유료이면 설정가는 제품가와 기본 배송비를 담는다', () => {
  const product = createProduct();
  const result = parseToProductTableRow({
    ...product,
    sheet: {
      ...product.sheet,
      delivery: { feeType: DELIVERY_FEE_TYPE.UNIT_QUANTITY_PAID, baseFee: 2500 },
    },
  });

  expect(result.configuredPrice).toEqual({ price: 39900, deliveryFee: 2500 });
});

it('시트의 배송비 유형이 무료이면 설정가는 무료배송 기준가와 배송비 0을 담는다', () => {
  const product = createProduct();
  const result = parseToProductTableRow({
    ...product,
    sheet: { ...product.sheet, delivery: { feeType: DELIVERY_FEE_TYPE.FREE } },
  });

  expect(result.configuredPrice).toEqual({ price: 50000, deliveryFee: 0 });
});

it('현재가는 스토어의 판매가와 스토어의 배송비를 그대로 담는다', () => {
  const result = parseToProductTableRow(createProduct());

  expect(result.currentPrice).toEqual({ price: 30000, deliveryFee: 2500 });
});

describe('wait 상태이면', () => {
  it('수정가는 없고 상태는 wait이다', () => {
    const result = parseToProductTableRow(createProduct({ update: { status: 'wait' } }));

    expect(result.updatedPrice).toBeNull();
    expect(result.status).toBe('wait');
  });

  it('수정 시간은 —이다', () => {
    const result = parseToProductTableRow(createProduct({ update: { status: 'wait' } }));

    expect(result.updateTime).toBe('—');
  });
});

describe('complete 상태이면', () => {
  const updateTime = new Date('2026-10-14T14:32:05').getTime();
  const update = { status: 'complete', price: 38000, baseFee: 2000, time: updateTime } as const;

  it('수정가는 수정 판매가와 수정 배송비를 그대로 담는다', () => {
    const result = parseToProductTableRow(createProduct({ update }));

    expect(result.updatedPrice).toEqual({ price: 38000, deliveryFee: 2000 });
  });

  it('현재가는 수정 전 스토어 값 그대로이다', () => {
    const result = parseToProductTableRow(createProduct({ update }));

    expect(result.currentPrice).toEqual({ price: 30000, deliveryFee: 2500 });
  });

  it('상태는 complete이다', () => {
    const result = parseToProductTableRow(createProduct({ update }));

    expect(result.status).toBe('complete');
  });

  it('수정 시간을 시:분:초로 만든다', () => {
    const result = parseToProductTableRow(createProduct({ update }));

    expect(result.updateTime).toBe('14:32:05');
  });
});

describe('error 상태이면', () => {
  const updateTime = new Date('2026-10-14T11:35:09').getTime();
  const update = { status: 'error', time: updateTime } as const;

  it('수정가는 없고 상태는 error이다', () => {
    const result = parseToProductTableRow(createProduct({ update }));

    expect(result.updatedPrice).toBeNull();
    expect(result.status).toBe('error');
  });

  it('실패한 시각을 수정 시간으로 만든다', () => {
    const result = parseToProductTableRow(createProduct({ update }));

    expect(result.updateTime).toBe('11:35:09');
  });
});
