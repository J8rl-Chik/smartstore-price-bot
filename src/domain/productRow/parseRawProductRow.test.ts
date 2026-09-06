import { describe, expect, it } from 'vitest';
import {
  COLUMN,
  convertToRawProductRow,
  parseExcludedSellerNames,
  parseProductRow,
  parseVirtualPrice,
  validateFeeType,
} from './parseRawProductRow.js';
import { DeliveryFeeType } from '../delivery/_type.js';
import { RawProductRow, RowValues } from './_type.js';

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
  const row = [];
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

  it('virtualPrice가 0이면 에러를 던진다', () => {
    expect(parseVirtualPrice('0')).toThrow('0보다 큰 값이어야 합니다');
  });

  it('virtualPrice가 숫자로 변환할 수 없는 값이면 에러를 던진다', () => {
    expect(parseVirtualPrice('가격 미정')).toThrow('숫자로 변환할 수 없습니다');
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

describe('validateFeeType', () => {
  it('feeType이 무료면 "무료"를 반환한다.', () => {
    const freeFee = '무료';

    expect(validateFeeType(freeFee)).toBe(freeFee);
  });

  it('feeType이 유료면 "유료"를 반환한다.', () => {
    const paidFee = '유료';

    expect(validateFeeType(paidFee)).toBe(paidFee);
  });

  it('feeType이 수량별이면 "수량별"을 반환한다.', () => {
    const unitQuantityPaidFee = '수량별';

    expect(validateFeeType(unitQuantityPaidFee)).toBe(unitQuantityPaidFee);
  });

  it('알 수 없는 feeType는 에러를 던진다.', () => {
    const unknownFee = '착불' as DeliveryFeeType;

    expect(validateFeeType(unknownFee)).toBe('알 수 없는 배송비 유형입니다.');
  });
});

describe('convertToRawProductRow', () => {
  it('제품 행을 이루는 문자열들을 객체 형태로 변환한다.', () => {
    const rowValues: RowValues = [
      '테스트 상품',
      'https://example.com/catalog',
      'TRUE',
      '무료',
      '₩10,000',
      '₩15,000',
      '₩3,000',
      '₩2,000',
      '판매처A,',
    ];

    expect(convertToRawProductRow(rowValues)).toEqual({
      name: '테스트 상품',
      catalogURL: 'https://example.com/catalog',
      activate: 'TRUE',
      feeType: '무료',
      freeDeliveryPrice: '₩10,000',
      productPrice: '₩15,000',
      baseFee: '₩3,000',
      virtualPrice: '₩2,000',
      excludedSellers: '판매처A,',
    });
  });

  it('제품 행을 이루는 값들에 undefined 값이 있으면 에러를 던진다.', () => {
    const rowValues = ['', '', '', '', undefined, '', '', ''];

    expect(convertToRawProductRow(rowValues as unknown as RowValues)).toThrow(
      '행에 undefined 값이 있습니다.',
    );
  });
});

describe('parseProductRow', () => {
  it('프로퍼티의 문자열 값들을 사용에 알맞은 형태로 변환한다.', () => {
    const rowValues: RowValues = [
      '테스트 상품',
      'https://example.com/catalog',
      'TRUE',
      '무료',
      '₩10,000',
      '₩15,000',
      '₩3,000',
      '₩2,000',
      '판매처A,  판매처B,',
    ];

    expect(parseProductRow(rowValues)).toEqual({
      name: '테스트 상품',
      catalogURL: 'https://example.com/catalog',
      activate: 'TRUE',
      feeType: '무료',
      freeDeliveryPrice: 10_000,
      productPrice: 15_000,
      baseFee: 3_000,
      virtualPrice: 2_000,
      excludedSellers: ['판매처A', '판매처B'],
    });
  });

  it('가격(KRW) 문자열을 숫자로 변환한다', () => {
    const result = parseProductRow([
      '테스트 상품',
      'https://example.com/catalog',
      'TRUE',
      '무료',
      '₩10,000',
      '15,000',
      '2,500',
      '1,000',
      '판매처A,  판매처B,',
    ]);

    expect(result.freeDeliveryPrice).toBe(10000);
    expect(result.productPrice).toBe(15000);
    expect(result.baseFee).toBe(2500);
    expect(result.virtualPrice).toBe(1000);
  });
});

describe('parseProductRow 에러', () => {
  it('필드 파싱 중 에러가 발생하면 상품명을 포함해 에러를 감싼다', () => {
    const row = createProductRow({ name: '무선 이어폰', productPrice: '가격미정' });

    expect(() => parseProductRow(row)).toThrow(
      "'무선 이어폰' 상품 파싱 에러: 숫자로 변환할 수 없습니다.",
    );
  });

  it('name 컬럼 값이 없으면 "(이름 없음)"으로 표시한다', () => {
    const row = [] as unknown as RowValues;

    expect(() => parseProductRow(row as RowValues)).toThrow("'(이름 없음)' 상품 파싱 에러:");
  });
});
