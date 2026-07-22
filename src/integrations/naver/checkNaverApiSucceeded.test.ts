import { describe, expect, it } from 'vitest';
import checkNaverApiSucceeded from './checkNaverApiSucceeded.js';

describe('checkNaverApiSucceeded', () => {
  it('message가 없으면 통과한다(에러를 던지지 않는다)', () => {
    expect(() => checkNaverApiSucceeded({ access_token: 'token-abc' })).not.toThrow();
  });

  it('message가 있으면 그 메시지로 에러를 던진다', () => {
    expect(() => checkNaverApiSucceeded({ message: '유효하지 않은 요청입니다.' })).toThrow(
      '유효하지 않은 요청입니다.',
    );
  });

  it('message가 빈 문자열이면 실패로 보지 않는다', () => {
    expect(() => checkNaverApiSucceeded({ message: '' })).not.toThrow();
  });
});
