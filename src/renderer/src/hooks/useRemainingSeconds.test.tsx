import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useRemainingSeconds from './useRemainingSeconds';

const startTime = 1700000000000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(startTime);
});

afterEach(() => {
  vi.useRealTimers();
});

test('처음에는 targetTime까지 남은 초를 알려준다', async () => {
  const { result } = await renderHook(() => useRemainingSeconds(startTime + 30 * 1000));

  expect(result.current).toBe(30);
});

test('1초마다 남은 초를 다시 계산한다', async () => {
  const { result, act } = await renderHook(() => useRemainingSeconds(startTime + 30 * 1000));

  await act(() => {
    vi.advanceTimersByTime(1000);
  });

  expect(result.current).toBe(29);
});

test('1초 미만으로 남으면 올림해서 1초로 알려준다', async () => {
  const { result } = await renderHook(() => useRemainingSeconds(startTime + 500));

  expect(result.current).toBe(1);
});

test('targetTime이 지나면 0초로 알려준다', async () => {
  const { result, act } = await renderHook(() => useRemainingSeconds(startTime + 1000));

  await act(() => {
    vi.advanceTimersByTime(3000);
  });

  expect(result.current).toBe(0);
});

test('언마운트하면 다시 계산하지 않는다', async () => {
  const { unmount } = await renderHook(() => useRemainingSeconds(startTime + 30 * 1000));

  expect(vi.getTimerCount()).toBe(1);

  await unmount();

  expect(vi.getTimerCount()).toBe(0);
});
