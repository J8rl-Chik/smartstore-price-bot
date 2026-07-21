import parseToNumberFromKRW from './parseToNumberFromKRW.js';
import { DELIVERY_FEE_TYPE, type DeliveryFeeType } from './constant.js';

// 구글 시트 "A~L" 범위 12개 컬럼의 인덱스.
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

export type ProductRow = string[];

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

export const isActiveProductRow = (rawRow: string[]): boolean => rawRow[COLUMN.activate] === 'TRUE';

// 시트에서 읽은 원시 행(길이가 제각각일 수 있음)을 고정 열 길이 행으로 초기화한다.
export const fillEmptyCell = (rawRow: string[]): ProductRow => {
  // 구글 시트 "A~L" 범위
  const columnLength = 12 as const;

  return Array.from({ length: columnLength }, (_, columnIndex) => rawRow[columnIndex] ?? '');
};

const parseVirtualPrice = (virtualPrice: string): number | null => {
  if (virtualPrice === '') {
    return null;
  }

  return parseToNumberFromKRW(virtualPrice);
};

const parseExcludedSellerNames = (excludedSellers: string): string[] =>
  excludedSellers.split(',').map((sellerName) => sellerName.trim());

/**
 * 현재 시트에 잘못된 값들이 많아 수정하는데 시간이 필요하다.
 * 따라서 에러를 던지기보다는 filter로 걸러낸 뒤 정상적인 행들만 파싱한다.
 */
const hasValidPrice = (price: string): boolean => {
  try {
    parseToNumberFromKRW(price);

    return true;
  } catch {
    return false;
  }
};

const validateFeeType = (feeType: string): DeliveryFeeType => {
  if (!(Object.values(DELIVERY_FEE_TYPE) as string[]).includes(feeType)) {
    throw new Error('알 수 없는 배송비 유형입니다.');
  }

  return feeType as DeliveryFeeType;
};

/**
 * ProductRow는 길이가 보장되지 않는 string[]이라 특정 컬럼이 채워져 있다는 보장이 타입만으로는
 * 안 되므로, COLUMN에 정의된 모든 컬럼 값을 한 번에 검증하고, 하나라도 없으면 즉시 실패한다.
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
      excludedSellerNames: parseExcludedSellerNames(excludedSellers),
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
 * 활성화된 행만 먼저 걸러낸 뒤(isActiveProductRow) 빈 셀을 채우고(fillEmptyCell),
 * 가격 필드가 유효한 행만 남긴 뒤(hasValidPrice) 파싱한다(parseProductRow).
 * 시트에 유효하지 않은 가격 값이 섞여 있어도 해당 행만 건너뛰고 계속 진행한다.
 */
export const initProductRow = (rawRows: string[][]): ParsedProductRow[] =>
  rawRows
    .filter(isActiveProductRow)
    .map(fillEmptyCell)
    .filter((row) => {
      const freeDeliveryPrice = row[COLUMN.freeDeliveryPrice] ?? '';
      const productPrice = row[COLUMN.productPrice] ?? '';
      const baseFee = row[COLUMN.baseFee] ?? '';

      return (
        hasValidPrice(freeDeliveryPrice) && hasValidPrice(productPrice) && hasValidPrice(baseFee)
      );
    })
    .map(parseProductRow);

export const findProductRow = (
  productRows: ProductRow[],
  productName: string,
): ProductRow | undefined =>
  productRows.find((productRow) => productRow[COLUMN.name] === productName);
