import { describe, expect, it } from 'vitest';
import checkSmartStoreApiSucceeded from './checkSmartStoreApiSucceeded.js';
import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';

describe('checkSmartStoreApiSucceeded', () => {
  it('message가 없으면 통과한다(에러를 던지지 않는다)', () => {
    expect(() => checkSmartStoreApiSucceeded({ access_token: 'token-abc' })).not.toThrow();
  });

  it('message가 있으면 API 실패 메시지 뒤에 그 메시지를 붙여 에러를 던진다', () => {
    expect(() => checkSmartStoreApiSucceeded({ message: '유효하지 않은 요청입니다.' })).toThrow(
      `${ERROR_MESSAGE.SMART_STORE_API_FAILED} (message: 유효하지 않은 요청입니다.)`,
    );
  });

  it('message가 빈 문자열이면 실패로 보지 않는다', () => {
    expect(() => checkSmartStoreApiSucceeded({ message: '' })).not.toThrow();
  });
});
