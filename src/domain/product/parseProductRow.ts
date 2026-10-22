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

/**
 * 구글 시트 행 하나를 사용하기 편리한 형태(ProductRow)로 변환한다.
 * 빈 셀 채우기와 활성화된 행 걸러내기는 getProductRows에서 이미 끝난 상태다.
 * 변환에 실패한 칸이 있어도 에러를 던지지 않고 에러 결과로 반환해, 어떤 행을 고쳐야 하는지 UI에서 볼 수 있게 한다.
 */
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
