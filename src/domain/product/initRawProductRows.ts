import parseToNumberFromKRW from '../price/parseToNumberFromKRW.js';
import { COLUMN } from './_constant.js';
import { parseProductRow } from './parseRawProductRow.js';
import type { ProductRow, RowValues } from './_type.js';

/**
 * 구글 시트 API로 받은 행 배열을 사용하기 편리한 형태로 가공한다.
 * 빈 셀 채우기와 활성화된 행 걸러내기는 getProductRows에서 이미 끝난 상태다.
 * 가격 필드가 유효한 행만 남긴 뒤(hasValidPrice) 파싱한다(parseProductRow).
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

export const initRawProductRows = (rawProductRows: RowValues[]): ProductRow[] =>
  rawProductRows
    .filter((row) => {
      const freeDeliveryPrice = row[COLUMN.freeDeliveryPrice] ?? '';
      const productPrice = row[COLUMN.productPrice] ?? '';
      const baseFee = row[COLUMN.baseFee] ?? '';

      /**
       * TODO: 유료배송 행에서 productPrice + baseFee가 freeDeliveryPrice와 다르면 알리거나 건너뛰는 검사를 추가할지 검토한다.
       * 시트 수식이 값으로 덮어쓰이면 설정가가 조용히 어긋난다. 이 단계는 문자열이라 파싱 이후에 해야 할 수 있다.
       */
      // 시트에 잘못 입력한 가격들이 많아 수정 작업에 시간이 필요할 것 같아, 문제가 있는 가격의 행은 넘어가는 쪽으로 진행.
      return (
        hasValidPrice(freeDeliveryPrice) && hasValidPrice(productPrice) && hasValidPrice(baseFee)
      );
    })
    .map(parseProductRow);
