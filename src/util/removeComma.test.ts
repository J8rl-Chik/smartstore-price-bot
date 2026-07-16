import { describe, expect, it } from 'vitest';
import removeComma from './removeComma.js';

describe('removeComma', () => {
  it('문자열에 포함된 모든 콤마를 제거한다', () => {
    expect(removeComma('1,234,567')).toBe('1234567');
  });

  it('콤마가 없는 문자열은 그대로 반환한다', () => {
    expect(removeComma('12345')).toBe('12345');
  });

  it('빈 문자열은 빈 문자열을 반환한다', () => {
    expect(removeComma('')).toBe('');
  });
});
