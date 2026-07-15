import { describe, expect, it } from 'vitest';
import parseToNumberFromKRW from './parseToNumberFromKRW.js';

describe('parseToNumberFromKRW', () => {
  it('₩ 기호와 콤마가 포함된 문자열을 숫자로 변환한다', () => {
    expect(parseToNumberFromKRW('₩1,000')).toBe(1000);
  });

  it('₩ 기호 없이 콤마만 있는 문자열도 변환한다', () => {
    expect(parseToNumberFromKRW('1,000')).toBe(1000);
  });

  it('숫자로 변환할 수 없는 문자열이면 에러를 던진다', () => {
    expect(() => parseToNumberFromKRW('가격미정')).toThrow('숫자로 변환할 수 없습니다');
  });

  it('정수가 아니면 에러를 던진다', () => {
    expect(() => parseToNumberFromKRW('1,000.5')).toThrow('정수여야 합니다');
  });

  it('10의 배수가 아니면 에러를 던진다', () => {
    expect(() => parseToNumberFromKRW('1,005')).toThrow('10의 배수여야 합니다');
  });

  describe('isZeroAllowed 기본값(false)일 때', () => {
    it('0이면 에러를 던진다', () => {
      expect(() => parseToNumberFromKRW('0')).toThrow('0보다 큰 값이어야 합니다');
    });

    it('음수면 에러를 던진다', () => {
      expect(() => parseToNumberFromKRW('-10')).toThrow('0보다 큰 값이어야 합니다');
    });
  });

  describe('isZeroAllowed: true일 때', () => {
    it('0을 허용한다', () => {
      expect(parseToNumberFromKRW('0', { isZeroAllowed: true })).toBe(0);
    });

    it('빈 문자열도 0으로 허용한다', () => {
      expect(parseToNumberFromKRW('', { isZeroAllowed: true })).toBe(0);
    });

    it('음수면 여전히 에러를 던진다', () => {
      expect(() => parseToNumberFromKRW('-10', { isZeroAllowed: true })).toThrow(
        '0 이상이어야 합니다',
      );
    });
  });
});
