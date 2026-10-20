import { expect, it } from 'vitest';
import formatNumber from './formatNumber';

it('천 단위마다 구분 기호를 넣는다', () => {
  expect(formatNumber(1234567)).toBe('1,234,567');
});

it('천 단위 미만이면 구분 기호 없이 보여준다', () => {
  expect(formatNumber(800)).toBe('800');
});

it('0은 0으로 보여준다', () => {
  expect(formatNumber(0)).toBe('0');
});
