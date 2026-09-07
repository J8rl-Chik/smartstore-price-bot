import { describe, expect, it } from 'vitest';
import { COLUMN } from './parseRawProductRow.js';
import { fillEmptyCell, initRawProductRows, isActiveRow } from './initRawProductRows.js';
import type { RawProductRow, RowValues } from './_type.js';

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
}: Partial<RawProductRow> = {}): RowValues => {
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

describe('isActiveRow', () => {
  it('activate가 TRUE이면 true를 반환한다', () => {
    expect(isActiveRow(createProductRow({ activate: 'TRUE' }))).toBe(true);
  });

  it('activate가 TRUE가 아니면 false를 반환한다', () => {
    expect(isActiveRow(createProductRow({ activate: 'FALSE' }))).toBe(false);
  });
});

describe('fillEmptyCell', () => {
  it('원시 행 값을 컬럼 위치에 맞게 유지한다', () => {
    const rawRow: string[] = [];
    rawRow[COLUMN.virtualPrice] = '';

    expect(fillEmptyCell(rawRow)[COLUMN.virtualPrice]).toBe('');
  });

  it('원시 행이 짧아도 부족한 칸을 빈 문자열로 채운다', () => {
    const shortRawRow: string[] = [];
    shortRawRow[COLUMN.name] = '상품A'; // catalogURL(1) 이후 칸이 없는 짧은 행

    const productRow = fillEmptyCell(shortRawRow);

    expect(productRow[COLUMN.catalogURL]).toBe('');
    expect(productRow[COLUMN.excludedSellerNames]).toBe('');
  });
});

describe('initProductRows', () => {
  it('활성화된(activate가 TRUE인) 행만 파싱해서 반환한다', () => {
    const rawRows = [
      createProductRow({ name: '상품A', activate: 'TRUE' }),
      createProductRow({ name: '상품B', activate: 'FALSE' }),
    ];

    expect(initRawProductRows(rawRows).map((productRow) => productRow.name)).toEqual(['상품A']);
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(initRawProductRows([])).toEqual([]);
  });

  it('가격 필드(freeDeliveryPrice, productPrice, baseFee)가 유효하지 않은 행은 건너뛴다', () => {
    const invalidPriceRow = createProductRow({ name: '상품B' });
    invalidPriceRow[COLUMN.productPrice] = '가격미정';

    const rawRows = [createProductRow({ name: '상품A' }), invalidPriceRow];

    expect(initRawProductRows(rawRows).map((productRow) => productRow.name)).toEqual(['상품A']);
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
