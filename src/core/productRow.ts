import parseToNumberFromKRW from './parseToNumberFromKRW.js';
import { DELIVERY_FEE_TYPE, type DeliveryFeeType } from './constant.js';

/**
 * 구글 시트 "A~L" 범위 12개 컬럼의 인덱스. Google Sheets API의 세부사항이 아니라
 * "시트 행을 어떻게 해석할지"에 대한 core의 도메인 지식이므로 여기서 소유한다.
 */
export const COLUMN = {
  NAME: 0,
  CATALOG_URL: 1,
  ACTIVATE: 2,
  FEE_TYPE: 6,
  FREE_DELIVERY_PRICE: 7,
  PRODUCT_PRICE: 8,
  BASE_FEE: 9,
  VIRTUAL_PRICE: 10,
  EXCLUDED_SELLERS: 11,
} as const;

export type ProductRow = string[];

export interface ParsedProductRow {
  name: string;
  catalogUrl: string;
  feeType: DeliveryFeeType;
  freeDeliveryPrice: number;
  productPrice: number;
  baseFee: number;
  virtualPrice: number | null;
  excludedSellerNames: string[];
}

export const findProductRow = (
  productRows: ProductRow[],
  productName: string,
): ProductRow | undefined =>
  productRows.find((productRow) => productRow[COLUMN.NAME] === productName);

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

export const parseProductRow = (row: ProductRow): ParsedProductRow => ({
  name: row[COLUMN.NAME],
  catalogUrl: row[COLUMN.CATALOG_URL],
  feeType: validateFeeType(row[COLUMN.FEE_TYPE]),
  freeDeliveryPrice: parseToNumberFromKRW(row[COLUMN.FREE_DELIVERY_PRICE]),
  productPrice: parseToNumberFromKRW(row[COLUMN.PRODUCT_PRICE]),
  baseFee: parseToNumberFromKRW(row[COLUMN.BASE_FEE]),
  virtualPrice: parseVirtualPrice(row[COLUMN.VIRTUAL_PRICE]),
  excludedSellerNames: row[COLUMN.EXCLUDED_SELLERS]
    .split(',')
    .map((sellerName) => sellerName.trim()),
});
