import parseToNumberFromKRW from '../price/parseToNumberFromKRW.js';
import { DELIVERY_FEE_TYPE } from '../delivery/_constant.js';
import { COLUMN } from './_constant.js';
import { parseProductRow } from './parseRawProductRow.js';
import type { ProductRow, RowValues } from './_type.js';

/**
 * 구글 시트 API로 받은 행 배열을 사용하기 편리한 형태로 가공한다.
 * 빈 셀 채우기와 활성화된 행 걸러내기는 getProductRows에서 이미 끝난 상태다.
 * 무료배송은 무료배송가 칸, 유료·수량별은 상품가 칸만 시트에서 읽고 나머지 하나는 계산한다.
 * 행에 유효하지 않은 가격 값이 섞여 있으면, 해당 행만 건너뛰고 계속 진행한다.
 */

const hasValidPrice = (price: string): boolean => {
  try {
    parseToNumberFromKRW(price);

    return true;
  } catch {
    return false;
  }
};

const isFreeDeliveryRow = (row: RowValues): boolean =>
  row[COLUMN.feeType] === DELIVERY_FEE_TYPE.FREE;

// 배송 유형별로 시트에서 실제로 읽는 가격 칸(배송비 포함)이 모두 유효한지 확인한다.
const hasValidPrices = (row: RowValues): boolean => {
  const prices = isFreeDeliveryRow(row)
    ? [row[COLUMN.freeDeliveryPrice], row[COLUMN.baseFee]]
    : [row[COLUMN.productPrice], row[COLUMN.baseFee]];

  return prices.every(hasValidPrice);
};

/**
 * 시트에서 읽지 않는 가격 칸을 읽는 칸 값으로 덮어써, parseProductRow가 그 칸에서 실패하지 않게 한다.
 * 무료배송은 상품가가 곧 무료배송가라서 그대로 맞는 값이 된다.
 * 유료·수량별의 무료배송가 칸은 파싱용 임시 값이고, applyFreeDeliveryPrice에서 다시 계산한다.
 */
const fillUnreadPriceCell = (row: RowValues): RowValues =>
  (isFreeDeliveryRow(row)
    ? row.with(COLUMN.productPrice, row[COLUMN.freeDeliveryPrice])
    : row.with(COLUMN.freeDeliveryPrice, row[COLUMN.productPrice])) as RowValues;

// 유료·수량별의 무료배송가는 상품가에 배송비를 더한 값이다.
const applyFreeDeliveryPrice = (productRow: ProductRow): ProductRow =>
  productRow.feeType === DELIVERY_FEE_TYPE.FREE
    ? productRow
    : { ...productRow, freeDeliveryPrice: productRow.productPrice + productRow.baseFee };

// 시트에 잘못 입력한 가격들이 많아 수정 작업에 시간이 필요할 것 같아, 문제가 있는 가격의 행은 넘어가는 쪽으로 진행.
export const initRawProductRows = (rawProductRows: RowValues[]): ProductRow[] =>
  rawProductRows
    .filter(hasValidPrices)
    .map(fillUnreadPriceCell)
    .map(parseProductRow)
    .map(applyFreeDeliveryPrice);
