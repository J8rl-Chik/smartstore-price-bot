import { describe, expect, it } from 'vitest';
import { COLUMN } from './_constant.js';
import { initRawProductRows } from './initRawProductRows.js';
import type { ColumnKey, RowValues } from './_type.js';

const createProductRow = ({
  name = '테스트 상품',
  catalogURL = 'https://example.com/catalog',
  activate = 'TRUE',
  feeType = '무료',
  freeDeliveryPrice = '₩10,000',
  productPrice = '₩15,000',
  baseFee = '₩3,000',
  virtualPrice = '₩2,000',
  excludedSellerNames = '판매처A,',
}: Partial<Record<ColumnKey, string>> = {}): RowValues => {
  const row: string[] = [];
  row[COLUMN.name] = name;
  row[COLUMN.catalogURL] = catalogURL;
  row[COLUMN.activate] = activate;
  row[COLUMN.feeType] = feeType;
  row[COLUMN.freeDeliveryPrice] = freeDeliveryPrice;
  row[COLUMN.productPrice] = productPrice;
  row[COLUMN.baseFee] = baseFee;
  row[COLUMN.virtualPrice] = virtualPrice;
  row[COLUMN.excludedSellerNames] = excludedSellerNames;

  return row as unknown as RowValues;
};

describe('initProductRows', () => {
  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(initRawProductRows([])).toEqual([]);
  });

  it('무료배송 행은 상품가 칸을 읽지 않고 무료배송가를 상품가로 쓴다', () => {
    const rawRows = [
      createProductRow({ feeType: '무료', freeDeliveryPrice: '₩10,000', productPrice: '₩15,000' }),
    ];

    expect(initRawProductRows(rawRows)[0]).toMatchObject({
      freeDeliveryPrice: 10_000,
      productPrice: 10_000,
    });
  });

  it('유료배송 행은 무료배송가 칸을 읽지 않고 상품가에 배송비를 더해 무료배송가로 쓴다', () => {
    const rawRows = [
      createProductRow({
        feeType: '유료',
        freeDeliveryPrice: '₩10,000',
        productPrice: '₩15,000',
        baseFee: '₩3,000',
      }),
    ];

    expect(initRawProductRows(rawRows)[0]).toMatchObject({
      freeDeliveryPrice: 18_000,
      productPrice: 15_000,
      baseFee: 3_000,
    });
  });

  it('수량별 배송 행도 상품가에 배송비를 더해 무료배송가로 쓴다', () => {
    const rawRows = [
      createProductRow({ feeType: '수량별', productPrice: '₩15,000', baseFee: '₩2,500' }),
    ];

    expect(initRawProductRows(rawRows)[0]).toMatchObject({
      freeDeliveryPrice: 17_500,
      productPrice: 15_000,
    });
  });

  it('무료배송 행은 무료배송가나 배송비가 유효하지 않으면 건너뛴다', () => {
    const rawRows = [
      createProductRow({ name: '상품A', feeType: '무료' }),
      createProductRow({ name: '상품B', feeType: '무료', freeDeliveryPrice: '가격미정' }),
      createProductRow({ name: '상품C', feeType: '무료', baseFee: '가격미정' }),
    ];

    expect(initRawProductRows(rawRows).map((productRow) => productRow.name)).toEqual(['상품A']);
  });

  it('유료배송 행은 상품가나 배송비가 유효하지 않으면 건너뛴다', () => {
    const rawRows = [
      createProductRow({ name: '상품A', feeType: '유료' }),
      createProductRow({ name: '상품B', feeType: '유료', productPrice: '가격미정' }),
      createProductRow({ name: '상품C', feeType: '유료', baseFee: '가격미정' }),
    ];

    expect(initRawProductRows(rawRows).map((productRow) => productRow.name)).toEqual(['상품A']);
  });

  it('배송 유형에 따라 읽지 않는 가격 칸은 유효하지 않아도 건너뛰지 않는다', () => {
    const rawRows = [
      createProductRow({ name: '상품A', feeType: '무료', productPrice: '가격미정' }),
      createProductRow({ name: '상품B', feeType: '유료', freeDeliveryPrice: '가격미정' }),
    ];

    expect(initRawProductRows(rawRows).map((productRow) => productRow.name)).toEqual([
      '상품A',
      '상품B',
    ]);
  });
});

describe('initProductRows 에러', () => {
  it('배송비 유형이 알 수 없는 값이면 에러를 던진다', () => {
    const invalidFeeTypeRow = createProductRow({ name: '상품B' });
    invalidFeeTypeRow[COLUMN.feeType] = '정기구독';

    const rawRows = [createProductRow({ name: '상품A' }), invalidFeeTypeRow];

    expect(() => initRawProductRows(rawRows)).toThrow('알 수 없는 배송비 유형입니다');
  });
});
