import parseToNumberFromKRW from '../price/parseToNumberFromKRW.js';
import { COLUMN, parseProductRow } from './parseRawProductRow.js';
import type { EmptyRowValues, ProductRow, RowValues } from './_type.js';

/**
 * 구글 시트 API로 받은 행 배열을 사용하기 편리한 형태로 가공한다.
 * 활성화된 행만 먼저 걸러낸 뒤(isActiveRow) 빈 셀을 채우고(fillEmptyCell),
 * 가격 필드가 유효한 행만 남긴 뒤(hasValidPrice) 파싱한다(parseProductRow).
 * 행에 유효하지 않은 가격 값이 섞여 있으면, 해당 행만 건너뛰고 계속 진행한다.
 */
export const isActiveRow = (row: EmptyRowValues): boolean => row[COLUMN.activate] === 'TRUE';

// 시트에서 읽은 원시 행(길이가 제각각일 수 있음)을 고정 열 길이 행으로 초기화한다.
export const fillEmptyCell = (row: EmptyRowValues): RowValues => {
  // 구글 시트 "A~L" 범위
  const columnLength = 12;
  const filledRowValues = Array.from(
    { length: columnLength },
    (_, columnIndex) => row[columnIndex] ?? '',
  );

  return filledRowValues as RowValues;
};

const hasValidPrice = (price: string): boolean => {
  try {
    parseToNumberFromKRW(price);

    return true;
  } catch {
    return false;
  }
};

export const initRawProductRows = (rawProductRows: string[][]): ProductRow[] =>
  rawProductRows
    .filter(isActiveRow)
    .map(fillEmptyCell)
    .filter((row) => {
      const freeDeliveryPrice = row[COLUMN.freeDeliveryPrice] ?? '';
      const productPrice = row[COLUMN.productPrice] ?? '';
      const baseFee = row[COLUMN.baseFee] ?? '';

      // 시트에 잘못 입력한 가격들이 많아 수정 작업에 시간이 필요할 것 같아, 문제가 있는 가격의 행은 넘어가는 쪽으로 진행.
      return (
        hasValidPrice(freeDeliveryPrice) && hasValidPrice(productPrice) && hasValidPrice(baseFee)
      );
    })
    .map(parseProductRow);
