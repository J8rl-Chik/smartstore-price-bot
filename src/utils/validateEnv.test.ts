import { afterEach, describe, expect, it, vi } from 'vitest';
import validateEnv from './validateEnv.js';

describe('validateEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const key = 'TEST_KEY';
  const value = 'VALIDATE_ENV_TEST_KEY';

  it('환경 변수 값이 있으면 그대로 반환한다', () => {
    vi.stubEnv(key, value);

    expect(validateEnv(key)).toBe(value);
  });

  it('환경 변수가 설정되지 않았으면 키 이름을 포함한 에러를 던진다', () => {
    expect(() => validateEnv(key)).toThrow(`환경 변수 ${key}가 설정되지 않았습니다.`);
  });

  it('환경 변수가 빈 문자열이면 에러를 던진다', () => {
    vi.stubEnv(key, '');

    expect(() => validateEnv(key)).toThrow(`환경 변수 ${key}가 설정되지 않았습니다.`);
  });
});
