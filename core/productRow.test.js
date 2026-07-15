import { describe, expect, it } from 'vitest';
import { COLUMN } from '../google/constant.js';
import { findProductRow, parseProductRow } from './productRow.js';

const createRow = ({
  name = '테스트 상품',
  catalogUrl = 'https://example.com/catalog',
  feeType = '무료',
  freeDeliveryPrice = '₩10,000',
  productPrice = '₩15,000',
  baseFee = '₩3,000',
  virtualPrice = '',
  excludedSellers = '',
} = {}) => {
  const row = [];

  row[COLUMN.NAME] = name;
  row[COLUMN.CATALOG_URL] = catalogUrl;
  row[COLUMN.FEE_TYPE] = feeType;
  row[COLUMN.FREE_DELIVERY_PRICE] = freeDeliveryPrice;
  row[COLUMN.PRODUCT_PRICE] = productPrice;
  row[COLUMN.BASE_FEE] = baseFee;
  row[COLUMN.VIRTUAL_PRICE] = virtualPrice;
  row[COLUMN.EXCLUDED_SELLERS] = excludedSellers;

  return row;
};

describe('findProductRow', () => {
  const productRows = [createRow({ name: '상품A' }), createRow({ name: '상품B' })];

  it('이름이 일치하는 행을 찾는다', () => {
    expect(findProductRow(productRows, '상품B')).toBe(productRows[1]);
  });

  it('일치하는 행이 없으면 undefined를 반환한다', () => {
    expect(findProductRow(productRows, '상품C')).toBeUndefined();
  });
});

describe('parseProductRow', () => {
  it('각 컬럼을 의미 있는 필드명으로 매핑한다', () => {
    const row = createRow({
      name: '무선 이어폰',
      catalogUrl: 'https://example.com/catalog/1',
      feeType: '유료',
    });

    const result = parseProductRow(row);

    expect(result.name).toBe('무선 이어폰');
    expect(result.catalogUrl).toBe('https://example.com/catalog/1');
    expect(result.feeType).toBe('유료');
  });

  it('KRW 형식 가격 문자열을 숫자로 변환한다', () => {
    const row = createRow({
      freeDeliveryPrice: '₩10,000',
      productPrice: '15,000',
      baseFee: '2,500',
      virtualPrice: '1,000',
    });

    const result = parseProductRow(row);

    expect(result.freeDeliveryPrice).toBe(10000);
    expect(result.productPrice).toBe(15000);
    expect(result.baseFee).toBe(2500);
    expect(result.virtualPrice).toBe(1000);
  });

  describe('excludedSellerNames', () => {
    it('제외 판매처 목록을 콤마 기준으로 분리하고 공백을 제거한다', () => {
      const row = createRow({ excludedSellers: '판매처A, 판매처B,판매처C' });

      expect(parseProductRow(row).excludedSellerNames).toEqual(['판매처A', '판매처B', '판매처C']);
    });

    /**
     * 제외 판매처가 없는 셀(빈 문자열)은 ''.split(',')가 ['']를 반환해 excludedSellerNames가
     * 빈 배열이 아니라 [''] 이 됨. 실제 판매처 이름이 빈 문자열일 수 없어 필터링에는 영향 없지만
     * 현재 동작을 그대로 문서화해 둠.
     */
    it('제외 판매처가 없으면 빈 문자열 하나를 담은 배열을 반환한다', () => {
      const row = createRow({ excludedSellers: '' });

      expect(parseProductRow(row).excludedSellerNames).toEqual(['']);
    });

    /**
     * 마지막에 콤마가 남아있으면(예: 시트에서 항목 삭제 후 콤마만 지우지 않은 경우) 같은 이유로
     * 끝에 빈 문자열이 하나 더 추가됨. 이 역시 실제 판매처 이름이 빈 문자열일 수 없어 필터링에는
     * 영향 없지만, 현재 동작을 그대로 문서화해 둠.
     */
    it('마지막에 콤마가 남아있으면 끝에 빈 문자열이 추가된다', () => {
      const row = createRow({ excludedSellers: '판매처A, 판매처B,판매처C, ' });

      expect(parseProductRow(row).excludedSellerNames).toEqual([
        '판매처A',
        '판매처B',
        '판매처C',
        '',
      ]);
    });
  });

  describe('feeType', () => {
    it('알 수 없는 배송비 유형이면 에러를 던진다', () => {
      const row = createRow({ feeType: '정기구독' });

      expect(() => parseProductRow(row)).toThrow('알 수 없는 배송비 유형입니다');
    });
  });

  describe('virtualPrice', () => {
    it('빈 문자열이면 virtualPrice를 null로 반환한다(가상 판매처 없음)', () => {
      const row = createRow({ virtualPrice: '' });

      expect(parseProductRow(row).virtualPrice).toBeNull();
    });

    it('0을 명시적으로 입력하면 에러를 던진다', () => {
      const row = createRow({ virtualPrice: '0' });

      expect(() => parseProductRow(row)).toThrow('0보다 큰 값이어야 합니다');
    });

    it('숫자로 변환할 수 없는 값이면 에러를 던진다', () => {
      const row = createRow({ virtualPrice: '가격미정' });

      expect(() => parseProductRow(row)).toThrow('숫자로 변환할 수 없습니다');
    });
  });

  describe('필수 가격 필드(freeDeliveryPrice, productPrice, baseFee) 검증', () => {
    it('freeDeliveryPrice가 유효하지 않으면 에러를 던진다', () => {
      const row = createRow({ freeDeliveryPrice: '0' });

      expect(() => parseProductRow(row)).toThrow('0보다 큰 값이어야 합니다');
    });

    it('0이면 에러를 던진다', () => {
      const row = createRow({ baseFee: '0' });

      expect(() => parseProductRow(row)).toThrow('0보다 큰 값이어야 합니다');
    });

    it('10의 배수가 아니면 에러를 던진다', () => {
      const row = createRow({ productPrice: '15,005' });

      expect(() => parseProductRow(row)).toThrow('10의 배수여야 합니다');
    });
  });
});
