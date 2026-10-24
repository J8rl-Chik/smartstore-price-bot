import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';

export interface SmartStoreApiResult {
  message?: string;
  [key: string]: unknown;
}

/**
 * 네이버 커머스 API는 실패해도 HTTP 상태 코드가 아니라 응답 바디의 message 필드로만 알려준다.
 * 이를 놓치면 실패한 요청이 성공한 것처럼 처리될 수 있어 즉시 실패시킨다.
 */
const checkSmartStoreApiSucceeded = (result: SmartStoreApiResult): void => {
  if (result.message) {
    throw new Error(`${ERROR_MESSAGE.SMART_STORE_API_FAILED} (message: ${result.message})`);
  }
};

export default checkSmartStoreApiSucceeded;
