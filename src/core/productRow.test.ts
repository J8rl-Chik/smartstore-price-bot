import { describe, expect, it } from 'vitest';
import {
  COLUMN,
  fillEmptyCell,
  initProductRow,
  isActiveProductRow,
  findProductRow,
  parseProductRow,
} from './productRow.js';

type CreateProductRowOption = Partial<Record<keyof typeof COLUMN, string>>;

const createProductRow = ({
  name = '테스트 상품',
  catalogUrl = 'https://example.com/catalog',
  activate = 'TRUE',
  feeType = '무료',
  freeDeliveryPrice = '₩10,000',
  productPrice = '₩15,000',
  baseFee = '₩3,000',
  virtualPrice = '',
  excludedSellers = '',
}: CreateProductRowOption = {}): string[] => {
  const row: string[] = [];
  row[COLUMN.name] = name;
  row[COLUMN.catalogUrl] = catalogUrl;
  row[COLUMN.activate] = activate;
  row[COLUMN.feeType] = feeType;
  row[COLUMN.freeDeliveryPrice] = freeDeliveryPrice;
  row[COLUMN.productPrice] = productPrice;
  row[COLUMN.baseFee] = baseFee;
  row[COLUMN.virtualPrice] = virtualPrice;
  row[COLUMN.excludedSellers] = excludedSellers;

  return row;
};

describe('findProductRow', () => {
  const productRows = [createProductRow({ name: '상품A' }), createProductRow({ name: '상품B' })];

  it('이름이 일치하는 행을 찾는다', () => {
    expect(findProductRow(productRows, '상품B')).toBe(productRows[1]);
  });

  it('일치하는 행이 없으면 undefined를 반환한다', () => {
    expect(findProductRow(productRows, '상품C')).toBeUndefined();
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
    shortRawRow[COLUMN.name] = '상품A'; // catalogUrl(1) 이후 칸이 없는 짧은 행

    const productRow = fillEmptyCell(shortRawRow);

    expect(productRow[COLUMN.catalogUrl]).toBe('');
    expect(productRow[COLUMN.excludedSellers]).toBe('');
  });
});

describe('isActiveProductRow', () => {
  it('activate가 TRUE이면 true를 반환한다', () => {
    expect(isActiveProductRow(createProductRow({ activate: 'TRUE' }))).toBe(true);
  });

  it('activate가 TRUE가 아니면 false를 반환한다', () => {
    expect(isActiveProductRow(createProductRow({ activate: 'FALSE' }))).toBe(false);
  });
});

describe('initProductRow', () => {
  it('활성화된(activate가 TRUE인) 행만 파싱해서 반환한다', () => {
    const rawRows = [
      createProductRow({ name: '상품A', activate: 'TRUE' }),
      createProductRow({ name: '상품B', activate: 'FALSE' }),
    ];

    expect(initProductRow(rawRows).map((productRow) => productRow.name)).toEqual(['상품A']);
  });

  it('빈 배열이면 빈 배열을 반환한다', () => {
    expect(initProductRow([])).toEqual([]);
  });

  it('가격 필드(freeDeliveryPrice, productPrice, baseFee)가 유효하지 않은 행은 건너뛴다', () => {
    const invalidPriceRow = createProductRow({ name: '상품B' });
    invalidPriceRow[COLUMN.productPrice] = '가격미정';

    const rawRows = [createProductRow({ name: '상품A' }), invalidPriceRow];

    expect(initProductRow(rawRows).map((productRow) => productRow.name)).toEqual(['상품A']);
  });

  it('배송비 유형이 알 수 없는 값이면 에러를 던진다', () => {
    const invalidFeeTypeRow = createProductRow({ name: '상품B' });
    invalidFeeTypeRow[COLUMN.feeType] = '정기구독';

    const rawRows = [createProductRow({ name: '상품A' }), invalidFeeTypeRow];

    expect(() => initProductRow(rawRows)).toThrow('알 수 없는 배송비 유형입니다');
  });
});

describe('parseProductRow', () => {
  it('각 컬럼을 의미 있는 필드명으로 매핑한다', () => {
    const row = createProductRow({
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
    const row = createProductRow({
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
});

describe('parseProductRow > 파싱 에러', () => {
  it('필드 파싱 중 에러가 발생하면 상품명을 포함해 에러를 감싼다', () => {
    const row = createProductRow({ name: '무선 이어폰', productPrice: '가격미정' });

    expect(() => parseProductRow(row)).toThrow(
      "'무선 이어폰' 상품 파싱 에러: 숫자로 변환할 수 없습니다.",
    );
  });

  it('name 컬럼 값이 없으면 "(이름 없음)"으로 표시한다', () => {
    const row: string[] = [];

    expect(() => parseProductRow(row)).toThrow("'(이름 없음)' 상품 파싱 에러:");
  });
});

describe('parseProductRow > excludedSellerNames', () => {
  it('제외 판매처 목록을 콤마 기준으로 분리하고 공백을 제거한다', () => {
    const row = createProductRow({ excludedSellers: '판매처A, 판매처B,판매처C' });

    expect(parseProductRow(row).excludedSellerNames).toEqual(['판매처A', '판매처B', '판매처C']);
  });

  /**
   * 제외 판매처가 없는 셀(빈 문자열)은 ''.split(',')가 ['']를 반환해 excludedSellerNames가
   * 빈 배열이 아니라 [''] 이 됨. 실제 판매처 이름이 빈 문자열일 수 없어 필터링에는 영향 없지만
   * 현재 동작을 그대로 문서화해 둠.
   */
  it('제외 판매처가 없으면 빈 문자열 하나를 담은 배열을 반환한다', () => {
    const row = createProductRow({ excludedSellers: '' });

    expect(parseProductRow(row).excludedSellerNames).toEqual(['']);
  });

  /**
   * 마지막에 콤마가 남아있으면(예: 시트에서 항목 삭제 후 콤마만 지우지 않은 경우) 같은 이유로
   * 끝에 빈 문자열이 하나 더 추가됨. 이 역시 실제 판매처 이름이 빈 문자열일 수 없어 필터링에는
   * 영향 없지만, 현재 동작을 그대로 문서화해 둠.
   */
  it('마지막에 콤마가 남아있으면 끝에 빈 문자열이 추가된다', () => {
    const row = createProductRow({ excludedSellers: '판매처A, 판매처B,판매처C, ' });

    expect(parseProductRow(row).excludedSellerNames).toEqual([
      '판매처A',
      '판매처B',
      '판매처C',
      '',
    ]);
  });
});

describe('parseProductRow > virtualPrice', () => {
  it('빈 문자열이면 virtualPrice를 null로 반환한다(가상 판매처 없음)', () => {
    const row = createProductRow({ virtualPrice: '' });

    expect(parseProductRow(row).virtualPrice).toBeNull();
  });

  it('0을 명시적으로 입력하면 에러를 던진다', () => {
    const row = createProductRow({ virtualPrice: '0' });

    expect(() => parseProductRow(row)).toThrow('0보다 큰 값이어야 합니다');
  });

  it('숫자로 변환할 수 없는 값이면 에러를 던진다', () => {
    const row = createProductRow({ virtualPrice: '가격미정' });

    expect(() => parseProductRow(row)).toThrow('숫자로 변환할 수 없습니다');
  });
});

describe('parseProductRow > 필수 가격 필드(freeDeliveryPrice, productPrice, baseFee) 검증', () => {
  it('freeDeliveryPrice가 유효하지 않으면 에러를 던진다', () => {
    const row = createProductRow({ freeDeliveryPrice: '0' });

    expect(() => parseProductRow(row)).toThrow('0보다 큰 값이어야 합니다');
  });

  it('10의 배수가 아니면 다음 10 단위로 올림한다', () => {
    const row = createProductRow({ productPrice: '15,005' });

    expect(parseProductRow(row).productPrice).toBe(15010);
  });
});
