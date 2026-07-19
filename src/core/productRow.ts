import parseToNumberFromKRW from './parseToNumberFromKRW.js';
import { DELIVERY_FEE_TYPE, type DeliveryFeeType } from './constant.js';

/**
 * 구글 시트 "A~L" 범위 12개 컬럼의 인덱스. Google Sheets API의 세부사항이 아니라
 * "시트 행을 어떻게 해석할지"에 대한 core의 도메인 지식이므로 여기서 소유한다.
 */
export const COLUMN = {
  name: 0,
  catalogUrl: 1,
  activate: 2,
  feeType: 6,
  freeDeliveryPrice: 7,
  productPrice: 8,
  baseFee: 9,
  virtualPrice: 10,
  excludedSellers: 11,
} as const;

type ColumnKey = keyof typeof COLUMN;
type ValidatedRow = Record<ColumnKey, string>;

export interface ProductRow {
  [key: number]: string;
}

export interface ParsedProductRow {
  name: string;
  catalogUrl: string;
  activate: string;
  feeType: DeliveryFeeType;
  freeDeliveryPrice: number;
  productPrice: number;
  baseFee: number;
  virtualPrice: number | null;
  excludedSellerNames: string[];
}

// fillEmptyCell/parseProductRow를 거치기 전, 원시 행 상태에서 먼저 걸러낸다.
export const isActiveProductRow = (rawRow: string[]): boolean => rawRow[COLUMN.activate] === 'TRUE';

/**
 * 시트에서 읽은 원시 행(길이가 제각각일 수 있음)을 고정 열 길이 ProductRow로 일관화한다.
 * noUncheckedIndexedAccess 덕분에 뒤쪽 셀이 없는 짧은 행도 타입 에러 없이 안전하게 처리된다.
 */
export const fillEmptyCell = (rawRow: string[]): ProductRow => {
  // 구글 시트 "A~L" 범위
  const columnCount = 12 as const;

  return Array.from({ length: columnCount }, (_, columnIndex) => rawRow[columnIndex] ?? '');
};

const parseVirtualPrice = (virtualPrice: string): number | null => {
  if (virtualPrice === '') {
    return null;
  }

  return parseToNumberFromKRW(virtualPrice);
};

const validateFeeType = (feeType: string): DeliveryFeeType => {
  if (!(Object.values(DELIVERY_FEE_TYPE) as string[]).includes(feeType)) {
    throw new Error(`알 수 없는 배송비 유형입니다: "${feeType}"`);
  }

  return feeType as DeliveryFeeType;
};

/**
 * ProductRow는 인덱스 시그니처라 특정 컬럼이 채워져 있다는 보장이 타입만으로는 안 되므로,
 * COLUMN에 정의된 모든 컬럼 값을 한 번에 검증하고, 하나라도 없으면 즉시 실패한다.
 */
const validateRow = (row: ProductRow): ValidatedRow => {
  const entries = (Object.keys(COLUMN) as ColumnKey[]).map((columnKey): [ColumnKey, string] => {
    const value = row[COLUMN[columnKey]];

    if (value === undefined) {
      throw new Error(`ProductRow에 ${columnKey} 컬럼 값이 없습니다.`);
    }

    return [columnKey, value];
  });

  return Object.fromEntries(entries) as ValidatedRow;
};

export const parseProductRow = (row: ProductRow): ParsedProductRow => {
  try {
    const {
      name,
      catalogUrl,
      activate,
      feeType,
      freeDeliveryPrice,
      productPrice,
      baseFee,
      virtualPrice,
      excludedSellers,
    } = validateRow(row);

    return {
      name,
      catalogUrl,
      activate,
      feeType: validateFeeType(feeType),
      freeDeliveryPrice: parseToNumberFromKRW(freeDeliveryPrice),
      productPrice: parseToNumberFromKRW(productPrice),
      baseFee: parseToNumberFromKRW(baseFee),
      virtualPrice: parseVirtualPrice(virtualPrice),
      excludedSellerNames: excludedSellers.split(',').map((sellerName) => sellerName.trim()),
    };
  } catch (error) {
    const productName = row[COLUMN.name] ?? '(이름 없음)';

    throw new Error(
      `'${productName}' 상품 파싱 에러: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

/**
 * 구글 시트 API로 받은 원시 행 배열을 실제로 쓰이는 형태로 가공한다.
 * 활성화된 행만 먼저 걸러낸 뒤(isActiveProductRow) 빈 셀을 채우고(fillEmptyCell) 파싱한다
 * (parseProductRow). 비활성 행은 파싱하지 않으므로 값이 비어있거나 잘못돼 있어도 실패하지 않는다.
 */
export const initProductRow = (rawRows: string[][]): ParsedProductRow[] =>
  rawRows.filter(isActiveProductRow).map(fillEmptyCell).map(parseProductRow);

export const findProductRow = (
  productRows: ProductRow[],
  productName: string,
): ProductRow | undefined =>
  productRows.find((productRow) => productRow[COLUMN.name] === productName);
