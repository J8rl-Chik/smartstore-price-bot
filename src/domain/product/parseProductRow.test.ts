import { describe, expect, it } from 'vitest';
import {
  parseCell,
  parseExcludedSellerNames,
  parsePriceByFeeType,
  parseProductRow,
  parseVirtualPrice,
} from './parseProductRow.js';
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

describe('parseCell', () => {
  it('변환에 성공하면 결과를 반환하고 에러 메시지를 추가하지 않는다', () => {
    const errorMessages: string[] = [];

    expect(parseCell(errorMessages, 'virtualPrice', () => 1_000)).toBe(1_000);
    expect(errorMessages).toEqual([]);
  });

  it('변환에 실패하면 undefined를 반환하고 칸 이름과 에러 메시지를 추가한다', () => {
    const errorMessages: string[] = [];

    expect(
      parseCell(errorMessages, 'productPrice', () => {
        throw new Error('변환 실패');
      }),
    ).toBeUndefined();
    expect(errorMessages).toEqual(['productPrice: 변환 실패']);
  });

  it('Error가 아닌 값을 던지면 문자열로 바꿔 에러 메시지를 추가한다', () => {
    const errorMessages: string[] = [];

    parseCell(errorMessages, 'baseFee', () => {
      throw '변환 실패';
    });

    expect(errorMessages).toEqual(['baseFee: 변환 실패']);
  });

  it('이미 있는 에러 메시지 뒤에 이어서 추가한다', () => {
    const errorMessages = ['feeType: 기존 에러'];

    parseCell(errorMessages, 'baseFee', () => {
      throw new Error('변환 실패');
    });

    expect(errorMessages).toEqual(['feeType: 기존 에러', 'baseFee: 변환 실패']);
  });
});

describe('parsePriceByFeeType', () => {
  it('배송 유형이 undefined면 가격 칸을 읽지 않고 빈 객체를 반환한다', () => {
    const errorMessages: string[] = [];
    const row = createProductRow({ freeDeliveryPrice: '가격미정', productPrice: '가격미정' });
    const feeType = undefined;

    /**
     * 배송 유형은 parsePriceByFeeType 호출 이전에 검증해서 실패하면 undefined가 되고,
     * 그 에러 메시지는 이미 errorMessages에 추가된 상태다. 그래서 여기서는 새 에러 메시지를 추가하지 않는다.
     */
    expect(parsePriceByFeeType(errorMessages, feeType, row)).toEqual({});
    expect(errorMessages).toEqual([]);
  });

  it('무료배송이면 무료배송가 칸만 읽고 상품가는 무료배송가로, 배송비는 0으로 둔다', () => {
    const errorMessages: string[] = [];
    const row = createProductRow({
      freeDeliveryPrice: '₩10,000',
      productPrice: '가격미정',
      baseFee: '가격미정',
    });

    expect(parsePriceByFeeType(errorMessages, '무료', row)).toEqual({
      freeDeliveryPrice: 10_000,
      productPrice: 10_000,
      baseFee: 0,
    });
    expect(errorMessages).toEqual([]);
  });

  it('유료배송이면 상품가와 배송비 칸만 읽고 무료배송가는 둘을 더한 값으로 둔다', () => {
    const errorMessages: string[] = [];
    const row = createProductRow({
      freeDeliveryPrice: '가격미정',
      productPrice: '₩15,000',
      baseFee: '₩3,000',
    });

    expect(parsePriceByFeeType(errorMessages, '유료', row)).toEqual({
      freeDeliveryPrice: 18_000,
      productPrice: 15_000,
      baseFee: 3_000,
    });
    expect(errorMessages).toEqual([]);
  });

  it('수량별 배송도 유료배송처럼 무료배송가를 상품가와 배송비를 더한 값으로 둔다', () => {
    const errorMessages: string[] = [];
    const row = createProductRow({
      freeDeliveryPrice: '가격미정',
      productPrice: '₩15,000',
      baseFee: '₩2,500',
    });

    expect(parsePriceByFeeType(errorMessages, '수량별', row)).toEqual({
      freeDeliveryPrice: 17_500,
      productPrice: 15_000,
      baseFee: 2_500,
    });
    expect(errorMessages).toEqual([]);
  });

  it('무료배송에서 무료배송가 변환에 실패하면 무료배송가와 상품가를 비우고 에러 메시지를 추가한다', () => {
    const errorMessages: string[] = [];
    const row = createProductRow({ freeDeliveryPrice: '가격미정' });

    expect(parsePriceByFeeType(errorMessages, '무료', row)).toEqual({
      freeDeliveryPrice: undefined,
      productPrice: undefined,
      baseFee: 0,
    });
    expect(errorMessages).toEqual([
      `freeDeliveryPrice: ${ERROR_MESSAGE.PRICE_NOT_NUMBER} (krw: 가격미정)`,
    ]);
  });

  it('유료배송에서 상품가 변환에 실패하면 무료배송가를 계산하지 않고 에러 메시지를 추가한다', () => {
    const errorMessages: string[] = [];
    const row = createProductRow({ productPrice: '가격미정', baseFee: '₩3,000' });

    expect(parsePriceByFeeType(errorMessages, '유료', row)).toEqual({
      freeDeliveryPrice: undefined,
      productPrice: undefined,
      baseFee: 3_000,
    });
    expect(errorMessages).toEqual([
      `productPrice: ${ERROR_MESSAGE.PRICE_NOT_NUMBER} (krw: 가격미정)`,
    ]);
  });
});

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
        productPrice: 10_000,
        baseFee: 0,
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
      '유료',
      '₩10,000',
      '15,000',
      '2,500',
      '1,000',
      '판매처A,  판매처B,',
    ]);

    expect(result).toMatchObject({
      status: 'ok',
      productRow: {
        freeDeliveryPrice: 17500,
        productPrice: 15000,
        baseFee: 2500,
        virtualPrice: 1000,
      },
    });
  });
});

describe('parseProductRow 에러', () => {
  it('변환에 실패한 칸이 있으면 성공한 값과 실패한 칸의 에러 메시지를 함께 반환한다', () => {
    const row = createProductRow({
      name: '무선 이어폰',
      feeType: '유료',
      productPrice: '가격미정',
    });

    expect(parseProductRow(row)).toEqual({
      status: 'error',
      productRow: {
        name: '무선 이어폰',
        catalogURL: 'https://example.com/catalog',
        feeType: '유료',
        freeDeliveryPrice: undefined,
        productPrice: undefined,
        baseFee: 3_000,
        virtualPrice: 2_000,
        excludedSellerNames: ['판매처A', ''],
      },
      errorMessages: [`productPrice: ${ERROR_MESSAGE.PRICE_NOT_NUMBER} (krw: 가격미정)`],
    });
  });

  it('여러 칸이 실패하면 칸마다 에러 메시지를 모은다', () => {
    const row = createProductRow({ feeType: '유료', baseFee: '가격미정', virtualPrice: '0' });

    expect(parseProductRow(row)).toMatchObject({
      status: 'error',
      errorMessages: [
        `baseFee: ${ERROR_MESSAGE.PRICE_NOT_NUMBER} (krw: 가격미정)`,
        `virtualPrice: ${ERROR_MESSAGE.PRICE_NOT_POSITIVE} (krw: 0)`,
      ],
    });
  });

  it('배송 유형 변환에 실패하면 가격 칸을 읽지 않고 가격을 비워 둔다', () => {
    const row = createProductRow({ feeType: '정기구독', baseFee: '가격미정' });
    const result = parseProductRow(row);

    expect(result).toMatchObject({
      status: 'error',
      errorMessages: [`feeType: ${ERROR_MESSAGE.UNKNOWN_DELIVERY_FEE_TYPE} (feeType: 정기구독)`],
    });
    expect(result.productRow).not.toHaveProperty('freeDeliveryPrice');
    expect(result.productRow).not.toHaveProperty('productPrice');
    expect(result.productRow).not.toHaveProperty('baseFee');
  });
});
