import parseToNumberFromKRW from '../price/parseToNumberFromKRW.js';
import { validateFeeType } from '../delivery/validateFeeType.js';
import { COLUMN } from './_constant.js';
import type { ProductRow, RowValues } from './_type.js';

export const parseVirtualPrice = (virtualPrice: string): number | null => {
  if (virtualPrice === '') {
    return null;
  }

  return parseToNumberFromKRW(virtualPrice);
};

export const parseExcludedSellerNames = (excludedSellerName: string): string[] =>
  excludedSellerName.split(',').map((sellerName) => sellerName.trim());

export const parseProductRow = (rowValues: RowValues): ProductRow => {
  try {
    return {
      name: rowValues[COLUMN.name],
      catalogURL: rowValues[COLUMN.catalogURL],
      feeType: validateFeeType(rowValues[COLUMN.feeType]),
      freeDeliveryPrice: parseToNumberFromKRW(rowValues[COLUMN.freeDeliveryPrice]),
      productPrice: parseToNumberFromKRW(rowValues[COLUMN.productPrice]),
      baseFee: parseToNumberFromKRW(rowValues[COLUMN.baseFee]),
      virtualPrice: parseVirtualPrice(rowValues[COLUMN.virtualPrice]),
      excludedSellerNames: parseExcludedSellerNames(rowValues[COLUMN.excludedSellerNames]),
    };
  } catch (error) {
    const productName = rowValues[COLUMN.name] ?? '(이름 없음)';

    throw new Error(
      `'${productName}' 상품 파싱 에러: ${error instanceof Error ? error.message : error}`,
    );
  }
};
