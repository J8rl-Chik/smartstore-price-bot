import { expect, it } from 'vitest';
import formatRemainingTime from './formatRemainingTime';

it('한 시간 미만이면 분:초로 만든다', () => {
  expect(formatRemainingTime(29 * 60 + 59)).toBe('29:59');
});

it('한 자리 분, 초는 앞에 0을 채운다', () => {
  expect(formatRemainingTime(5 * 60 + 7)).toBe('05:07');
});

it('0초는 00:00이다', () => {
  expect(formatRemainingTime(0)).toBe('00:00');
});

it('한 시간 이상이면 앞에 시를 붙여 시:분:초로 만든다', () => {
  expect(formatRemainingTime(3600 + 2 * 60 + 3)).toBe('1:02:03');
});
