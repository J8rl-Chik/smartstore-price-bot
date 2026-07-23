import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import delayRandomSeconds from './delayRandomSeconds.js';

describe('delayRandomSeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('Math.random이 0이면 최솟값이 지나야 resolve된다', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const resolved = vi.fn();
    delayRandomSeconds(2, 5).then(resolved);

    await vi.advanceTimersByTimeAsync(2_000 - 1);
    expect(resolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toHaveBeenCalled();
  });

  it('Math.random이 1이면 최댓값이 지나야 resolve된다', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);

    const resolved = vi.fn();
    delayRandomSeconds(2, 5).then(resolved);

    await vi.advanceTimersByTimeAsync(5_000 - 1);
    expect(resolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toHaveBeenCalled();
  });

  it('minSeconds가 maxSeconds보다 크면 에러를 던진다', () => {
    expect(() => delayRandomSeconds(5, 2)).toThrow('minSeconds는 maxSeconds보다 클 수 없습니다.');
  });
});
