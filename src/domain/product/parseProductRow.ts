import parseToNumberFromKRW from '../price/parseToNumberFromKRW.js';
import { validateFeeType } from '../delivery/validateFeeType.js';
import { COLUMN } from './_constant.js';
import type { ColumnKey, ProductRow, ProductRowParseResult, RowValues } from './_type.js';
import { DELIVERY_FEE_TYPE } from '../delivery/_constant.js';
import type { DeliveryFeeType } from '../delivery/_type.js';
import { ERROR_MESSAGE } from '../error/errorMessage.js';

type Price = Partial<Pick<ProductRow, 'freeDeliveryPrice' | 'productPrice' | 'baseFee'>>;

// 칸 하나를 변환하고, 실패하면 이유를 errorMessages에 모은 뒤 undefined를 반환한다.
export const parseCell = <T>(
  errorMessages: string[],
  columnKey: ColumnKey,
  parse: () => T,
): T | undefined => {
  try {
    return parse();
  } catch (error) {
    errorMessages.push(`${columnKey}: ${error instanceof Error ? error.message : String(error)}`);

    return undefined;
  }
};

/**
 * 배송 유형에 필요한 가격 칸만 읽고, 나머지 가격은 계산한다.
 * 무료는 무료배송가 칸만 읽고 상품가를 같은 값으로, 배송비를 0으로 둔다.
 * 유료·수량별은 상품가와 배송비 칸만 읽고 무료배송가를 둘을 더한 값으로 둔다.
 */
export const parsePriceByFeeType = (
  errorMessages: string[],
  feeType: DeliveryFeeType | undefined,
  rowValues: RowValues,
): Price => {
  switch (feeType) {
    // 배송 유형 변환에 실패하면 어느 가격 칸을 읽을지 정할 수 없어 가격을 비워 둔다.
    case undefined:
      return {};

    case DELIVERY_FEE_TYPE.FREE: {
      const freeDeliveryPrice = parseCell(errorMessages, 'freeDeliveryPrice', () =>
        parseToNumberFromKRW(rowValues[COLUMN.freeDeliveryPrice]),
      );

      return { freeDeliveryPrice, productPrice: freeDeliveryPrice, baseFee: 0 };
    }

    case DELIVERY_FEE_TYPE.PAID:
    case DELIVERY_FEE_TYPE.UNIT_QUANTITY_PAID: {
      const productPrice = parseCell(errorMessages, 'productPrice', () =>
        parseToNumberFromKRW(rowValues[COLUMN.productPrice]),
      );
      const baseFee = parseCell(errorMessages, 'baseFee', () =>
        parseToNumberFromKRW(rowValues[COLUMN.baseFee]),
      );
      const freeDeliveryPrice =
        productPrice !== undefined && baseFee !== undefined ? productPrice + baseFee : undefined;

      return { freeDeliveryPrice, productPrice, baseFee };
    }
    // 새 배송 유형을 추가하고 위에서 처리하지 않으면 satisfies never에서 타입 에러가 난다.
    default:
      throw new Error(
        `${ERROR_MESSAGE.UNKNOWN_DELIVERY_FEE_TYPE} (feeType: ${feeType satisfies never})`,
      );
  }
};

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
  const errorMessages: string[] = [];

  const feeType = parseCell(errorMessages, 'feeType', () =>
    validateFeeType(rowValues[COLUMN.feeType]),
  );
  const price = parsePriceByFeeType(errorMessages, feeType, rowValues);

  const productRow = {
    name: rowValues[COLUMN.name],
    catalogURL: rowValues[COLUMN.catalogURL],
    virtualPrice: parseCell(errorMessages, 'virtualPrice', () =>
      parseVirtualPrice(rowValues[COLUMN.virtualPrice]),
    ),
    excludedSellerNames: parseCell(errorMessages, 'excludedSellerNames', () =>
      parseExcludedSellerNames(rowValues[COLUMN.excludedSellerNames]),
    ),
    feeType,
    ...price,
  };

  if (errorMessages.length > 0) {
    return { status: 'error', productRow, errorMessages };
  }

  // 실패한 칸이 없으면 모든 값이 채워져 있다.
  return { status: 'ok', productRow: productRow as ProductRow };
};
