import parseToNumberFromKRW from '../price/parseToNumberFromKRW.js';
import { validateFeeType } from '../delivery/validateFeeType.js';
import { COLUMN } from './_constant.js';
import type { ColumnKey, ProductRow, ProductRowParseResult, RowValues } from './_type.js';

export const parseVirtualPrice = (virtualPrice: string): number | null => {
  if (virtualPrice === '') {
    return null;
  }

  return parseToNumberFromKRW(virtualPrice);
};

export const parseExcludedSellerNames = (excludedSellerName: string): string[] =>
  excludedSellerName.split(',').map((sellerName) => sellerName.trim());

export const parseProductRow = (rowValues: RowValues): ProductRowParseResult => {
  // 칸 하나를 변환하고, 실패하면 이유를 errorMessages에 모은 뒤 undefined를 반환한다.
  const errorMessages: string[] = [];
  const parseCell = <T>(columnKey: ColumnKey, parse: () => T): T | undefined => {
    try {
      return parse();
    } catch (error) {
      errorMessages.push(`${columnKey}: ${error instanceof Error ? error.message : String(error)}`);

      return undefined;
    }
  };

  const productRow = {
    name: rowValues[COLUMN.name],
    catalogURL: rowValues[COLUMN.catalogURL],
    feeType: parseCell('feeType', () => validateFeeType(rowValues[COLUMN.feeType])),
    freeDeliveryPrice: parseCell('freeDeliveryPrice', () =>
      parseToNumberFromKRW(rowValues[COLUMN.freeDeliveryPrice]),
    ),
    productPrice: parseCell('productPrice', () =>
      parseToNumberFromKRW(rowValues[COLUMN.productPrice]),
    ),
    baseFee: parseCell('baseFee', () => parseToNumberFromKRW(rowValues[COLUMN.baseFee])),
    virtualPrice: parseCell('virtualPrice', () =>
      parseVirtualPrice(rowValues[COLUMN.virtualPrice]),
    ),
    excludedSellerNames: parseCell('excludedSellerNames', () =>
      parseExcludedSellerNames(rowValues[COLUMN.excludedSellerNames]),
    ),
  };

  if (errorMessages.length > 0) {
    return { status: 'error', productRow, errorMessages };
  }

  // 실패한 칸이 없으면 모든 값이 채워져 있다.
  return { status: 'ok', productRow: productRow as ProductRow };
};
