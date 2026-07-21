import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import delaySeconds from './delaySeconds.js';

describe('delaySeconds', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('지정한 초가 지나면 resolve된다', async () => {
    const resolved = vi.fn();
    delaySeconds(5).then(resolved);

    const second5 = 5_000;
    await vi.advanceTimersByTimeAsync(second5);

    expect(resolved).toHaveBeenCalled();
  });

  it('지정한 초가 지나기 전에는 resolve되지 않는다', async () => {
    const resolved = vi.fn();
    delaySeconds(5).then(resolved);

    const second4 = 4_999;
    await vi.advanceTimersByTimeAsync(second4);

    expect(resolved).not.toHaveBeenCalled();
  });
});
