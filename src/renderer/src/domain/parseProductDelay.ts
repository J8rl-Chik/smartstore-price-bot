import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import type { ParsedProductDelay } from './_type';

// 상품 간 대기 시간의 최솟값(초). 너무 빠르게 조회하면 네이버 쇼핑 접속 제한에 걸리므로 그 아래로는 받지 않는다.
export const MIN_PRODUCT_DELAY_SECONDS = 10;

// 상품 간 대기 시간 입력을 검사한다. 비워 두면 0으로 변환되어 최솟값보다 작은 입력으로 처리된다.
const parseProductDelay = (input: string): ParsedProductDelay => {
  const productDelaySeconds = Number(input.trim());

  if (!Number.isInteger(productDelaySeconds)) {
    return { isValid: false, errorMessage: ERROR_MESSAGE.PRODUCT_DELAY_NOT_INTEGER };
  }

  if (productDelaySeconds < MIN_PRODUCT_DELAY_SECONDS) {
    return { isValid: false, errorMessage: ERROR_MESSAGE.PRODUCT_DELAY_TOO_SHORT };
  }

  return { isValid: true, productDelaySeconds };
};

export default parseProductDelay;
