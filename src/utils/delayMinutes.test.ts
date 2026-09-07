import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';
import delayMinutes from './delayMinutes.js';

describe('delayMinutes', () => {
  vi.useFakeTimers();

  const resolved = vi.fn();

  afterEach(() => {
    resolved.mockClear();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('지정한 분이 지나면 resolve된다', async () => {
    delayMinutes(1).then(resolved);

    const minute1 = 60_000;

    await vi.advanceTimersByTimeAsync(minute1);
    expect(resolved).toHaveBeenCalled();
  });

  it('지정한 분이 지나기 전에는 resolve되지 않는다', async () => {
    delayMinutes(1).then(resolved);

    const second59 = 59_999;

    await vi.advanceTimersByTimeAsync(second59);
    expect(resolved).not.toHaveBeenCalled();
  });
});
