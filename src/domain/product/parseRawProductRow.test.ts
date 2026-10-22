import { describe, expect, it } from 'vitest';
import {
  parseExcludedSellerNames,
  parseProductRow,
  parseVirtualPrice,
} from './parseRawProductRow.js';
import { COLUMN } from './_constant.js';
import type { ColumnKey, RowValues } from './_type.js';
import { ERROR_MESSAGE } from '../error/errorMessage.js';

const createProductRow = ({
  name = '테스트 상품',
  catalogURL = 'https://example.com/catalog',
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
  row[COLUMN.feeType] = feeType;
  row[COLUMN.freeDeliveryPrice] = freeDeliveryPrice;
  row[COLUMN.productPrice] = productPrice;
  row[COLUMN.baseFee] = baseFee;
  row[COLUMN.virtualPrice] = virtualPrice;
  row[COLUMN.excludedSellerNames] = excludedSellerNames;

  return row as unknown as RowValues;
};

describe('parseVirtualPrice', () => {
  it('virtualPrice가 빈 문자열("")이면 null을 반환한다.', () => {
    expect(parseVirtualPrice('')).toBeNull();
  });

  it('virtualPrice가 "10"이면 10을 반환한다', () => {
    expect(parseVirtualPrice('10')).toBe(10);
  });

  it('virtualPrice가 "20"(10의 배수)이면 10을 반환한다.', () => {
    expect(parseVirtualPrice('20')).toBe(20);
  });

  it('virtualPrice가 "0"이면 에러를 던진다', () => {
    expect(() => parseVirtualPrice('0')).toThrow(`${ERROR_MESSAGE.PRICE_NOT_POSITIVE} (krw: 0)`);
  });

  it('virtualPrice가 숫자로 변환할 수 없는 값이면 에러를 던진다', () => {
    expect(() => parseVirtualPrice('가격 미정')).toThrow(
      `${ERROR_MESSAGE.PRICE_NOT_NUMBER} (krw: 가격 미정)`,
    );
  });
});

describe('parseExcludedSellerNames', () => {
  it('제외 판매처 목록을 콤마 기준으로 분리하고 공백을 제거한다', () => {
    expect(parseExcludedSellerNames('판매처A, 판매처B,판매처C')).toEqual([
      '판매처A',
      '판매처B',
      '판매처C',
    ]);
  });

  it('제외 판매처가 없으면 빈 문자열 하나를 담은 배열을 반환한다', () => {
    expect(parseExcludedSellerNames('')).toEqual(['']);
  });

  it('마지막에 콤마가 남아있으면 끝에 빈 문자열이 추가된다', () => {
    expect(parseExcludedSellerNames('판매처A, 판매처B,판매처C, ')).toEqual([
      '판매처A',
      '판매처B',
      '판매처C',
      '',
    ]);
  });

  it('콤마가 없으면 그대로 판매처 이름으로 사용한다', () => {
    const excludedSellerName = '판매처A 판매처B';
    expect(parseExcludedSellerNames('판매처A 판매처B')).toEqual([excludedSellerName]);
  });
});

describe('parseProductRow', () => {
  it('프로퍼티의 문자열 값들을 사용에 알맞은 형태로 변환한다.', () => {
    const rowValues: RowValues = [
      '테스트 상품',
      'https://example.com/catalog',
      'TRUE',
      '',
      '',
      '',
      '무료',
      '₩10,000',
      '₩15,000',
      '₩3,000',
      '₩2,000',
      '판매처A,  판매처B,',
    ];

    expect(parseProductRow(rowValues)).toEqual({
      status: 'ok',
      productRow: {
        name: '테스트 상품',
        catalogURL: 'https://example.com/catalog',
        feeType: '무료',
        freeDeliveryPrice: 10_000,
        productPrice: 15_000,
        baseFee: 3_000,
        virtualPrice: 2_000,
        excludedSellerNames: ['판매처A', '판매처B', ''],
      },
    });
  });

  it('가격(KRW) 문자열을 숫자로 변환한다', () => {
    const result = parseProductRow([
      '테스트 상품',
      'https://example.com/catalog',
      'TRUE',
      '',
      '',
      '',
      '무료',
      '₩10,000',
      '15,000',
      '2,500',
      '1,000',
      '판매처A,  판매처B,',
    ]);

    expect(result).toMatchObject({
      status: 'ok',
      productRow: {
        freeDeliveryPrice: 10000,
        productPrice: 15000,
        baseFee: 2500,
        virtualPrice: 1000,
      },
    });
  });
});

describe('parseProductRow 에러', () => {
  it('변환에 실패한 칸이 있으면 성공한 값과 실패한 칸의 에러 메시지를 함께 반환한다', () => {
    const row = createProductRow({ name: '무선 이어폰', productPrice: '가격미정' });

    expect(parseProductRow(row)).toEqual({
      status: 'error',
      productRow: {
        name: '무선 이어폰',
        catalogURL: 'https://example.com/catalog',
        feeType: '무료',
        freeDeliveryPrice: 10_000,
        productPrice: undefined,
        baseFee: 3_000,
        virtualPrice: 2_000,
        excludedSellerNames: ['판매처A', ''],
      },
      errorMessages: [`productPrice: ${ERROR_MESSAGE.PRICE_NOT_NUMBER} (krw: 가격미정)`],
    });
  });

  it('여러 칸이 실패하면 칸마다 에러 메시지를 모은다', () => {
    const row = createProductRow({ feeType: '정기구독', baseFee: '가격미정', virtualPrice: '0' });

    expect(parseProductRow(row)).toMatchObject({
      status: 'error',
      errorMessages: [
        `feeType: ${ERROR_MESSAGE.UNKNOWN_DELIVERY_FEE_TYPE} (feeType: 정기구독)`,
        `baseFee: ${ERROR_MESSAGE.PRICE_NOT_NUMBER} (krw: 가격미정)`,
        `virtualPrice: ${ERROR_MESSAGE.PRICE_NOT_POSITIVE} (krw: 0)`,
      ],
    });
  });
});
