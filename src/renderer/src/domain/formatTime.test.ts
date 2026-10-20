import { afterEach, expect, it, vi } from 'vitest';
import formatTime from './formatTime';

afterEach(() => {
  vi.useRealTimers();
});

it('타임스탬프를 시:분:초로 만든다', () => {
  const timestamp = new Date('2026-10-14T14:32:05').getTime();

  expect(formatTime(timestamp)).toBe('14:32:05');
});

it('한 자리 시, 분, 초는 앞에 0을 채운다', () => {
  const timestamp = new Date('2026-10-14T03:04:05').getTime();

  expect(formatTime(timestamp)).toBe('03:04:05');
});

it('Date.now()를 넘기면 현재 시각을 시:분:초로 만든다', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-14T09:08:07'));

  expect(formatTime(Date.now())).toBe('09:08:07');
});

it('자정은 00:00:00이다', () => {
  const timestamp = new Date('2026-10-14T00:00:00').getTime();

  expect(formatTime(timestamp)).toBe('00:00:00');
});
