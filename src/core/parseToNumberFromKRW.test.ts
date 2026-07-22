import { describe, expect, it } from 'vitest';
import parseToNumberFromKRW from './parseToNumberFromKRW.js';

describe('parseToNumberFromKRW', () => {
  it('₩ 기호와 콤마가 포함된 문자열을 숫자로 변환한다', () => {
    expect(parseToNumberFromKRW('₩1,000')).toBe(1000);
  });

  it('₩ 기호 없이 콤마만 있는 문자열도 변환한다', () => {
    expect(parseToNumberFromKRW('1,000')).toBe(1000);
  });

  it('콤마가 여러 번 나와도 전부 제거하고 변환한다', () => {
    expect(parseToNumberFromKRW('1,234,560')).toBe(1234560);
  });

  it('숫자로 변환할 수 없는 문자열이면 에러를 던진다', () => {
    expect(() => parseToNumberFromKRW('가격미정')).toThrow('숫자로 변환할 수 없습니다');
  });

  it('실수면 에러를 던진다', () => {
    expect(() => parseToNumberFromKRW('1,000.5')).toThrow('정수여야 합니다');
  });

  it('10의 배수가 아니면 다음 10 단위로 올림한다', () => {
    expect(parseToNumberFromKRW('₩111')).toBe(120);
    expect(parseToNumberFromKRW('121')).toBe(130);
    expect(parseToNumberFromKRW('129')).toBe(130);
    expect(parseToNumberFromKRW('1,005')).toBe(1010);
  });

  it('0이면 에러를 던진다', () => {
    expect(() => parseToNumberFromKRW('0')).toThrow('0보다 큰 값이어야 합니다');
  });

  it('빈 문자열이면 에러를 던진다', () => {
    expect(() => parseToNumberFromKRW('')).toThrow('0보다 큰 값이어야 합니다');
  });

  it('음수면 에러를 던진다', () => {
    expect(() => parseToNumberFromKRW('-10')).toThrow('0보다 큰 값이어야 합니다');
  });
});
