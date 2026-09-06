import { DELIVERY_FEE_TYPE } from '../delivery/delivery.js';
import parseToNumberFromKRW from '../price/parseToNumberFromKRW.js';
import type { DeliveryFeeType } from '../delivery/_type.js';
import type { Column, ColumnKey, ProductRow, RawProductRow, RowValues } from './_type.js';

// 구글 시트 "A~L" 범위 12개 컬럼의 인덱스(프로그램 실행에 불필요한 범위는 제외).
export const COLUMN: Column = {
  name: 0,
  catalogURL: 1,
  activate: 2,
  feeType: 6,
  freeDeliveryPrice: 7,
  productPrice: 8,
  baseFee: 9,
  virtualPrice: 10,
  excludedSellerNames: 11,
} as const;

export const parseVirtualPrice = (virtualPrice: string): number | null => {
  if (virtualPrice === '') {
    return null;
  }

  return parseToNumberFromKRW(virtualPrice);
};

export const parseExcludedSellerNames = (excludedSellerName: string): string[] =>
  excludedSellerName.split(',').map((sellerName) => sellerName.trim());

export const validateFeeType = (feeType: string): DeliveryFeeType => {
  if (!(Object.values(DELIVERY_FEE_TYPE) as string[]).includes(feeType)) {
    throw new Error('알 수 없는 배송비 유형입니다.');
  }

  return feeType as DeliveryFeeType;
};

/**
 * 행(RowValues)은 길이가 보장되지 않는 string[]이라 특정 값이 채워져 있다고 장담할 수 없다.
 * 행(RowValues)에 undefined가 있는지 확인하고, 하나라도 있으면 에러를 던진다.
 * COLUMN 객체의 각 프로퍼티의 값은 구글 시트 행에서 어떤 값이 어디에 위치하는지 실제 인덱스 번호다.
 */

// TODO: convert가 적절한 표현인지 확인.
export const convertToRawProductRow = (rowVaues: RowValues): RawProductRow => {
  const entries = (Object.keys(COLUMN) as ColumnKey[]).map((columnKey): [ColumnKey, string] => {
    const value = rowVaues[COLUMN[columnKey]];

    if (value === undefined) {
      throw new Error(`행에 undefined 값이 있습니다.`);
    }

    return [columnKey, value];
  });

  return Object.fromEntries(entries) as RawProductRow;
};

export const parseProductRow = (rowValues: RowValues): ProductRow => {
  try {
    const {
      name,
      catalogURL,
      activate,
      feeType,
      freeDeliveryPrice,
      productPrice,
      baseFee,
      virtualPrice,
      excludedSellerNames,
    } = convertToRawProductRow(rowValues);

    return {
      name,
      catalogURL,
      activate,
      feeType: validateFeeType(feeType),
      freeDeliveryPrice: parseToNumberFromKRW(freeDeliveryPrice),
      productPrice: parseToNumberFromKRW(productPrice),
      baseFee: parseToNumberFromKRW(baseFee),
      virtualPrice: parseVirtualPrice(virtualPrice),
      excludedSellerNames: parseExcludedSellerNames(excludedSellerNames),
    };
  } catch (error) {
    const productName = rowValues[COLUMN.name] ?? '(이름 없음)';

    throw new Error(
      `'${productName}' 상품 파싱 에러: ${error instanceof Error ? error.message : error}`,
    );
  }
};
