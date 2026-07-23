import { afterEach, describe, expect, it } from 'vitest';
import validateEnv from './validateEnv.js';

describe('validateEnv', () => {
  const TEST_KEY = 'VALIDATE_ENV_TEST_KEY';

  afterEach(() => {
    delete process.env[TEST_KEY];
  });

  it('환경 변수 값이 있으면 그대로 반환한다', () => {
    process.env[TEST_KEY] = 'value';

    expect(validateEnv(TEST_KEY)).toBe('value');
  });

  it('환경 변수가 설정되지 않았으면 키 이름을 포함한 에러를 던진다', () => {
    delete process.env[TEST_KEY];

    expect(() => validateEnv(TEST_KEY)).toThrow(`환경 변수 ${TEST_KEY}가 설정되지 않았습니다.`);
  });

  it('환경 변수가 빈 문자열이면 에러를 던진다', () => {
    process.env[TEST_KEY] = '';

    expect(() => validateEnv(TEST_KEY)).toThrow(`환경 변수 ${TEST_KEY}가 설정되지 않았습니다.`);
  });
});
