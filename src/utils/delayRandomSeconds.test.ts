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

  /**
   * 실제 Math.random()은 0이상 1미만 범위라 1을 반환하는 일은 없지만, 그 경우에도
   * `minSeconds + random * (maxSeconds - minSeconds)` 공식이 정확히 maxSeconds로
   * 계산되는지(공식 자체의 상한 경계) 확인하기 위해 이론상의 값 1로 모킹한다.
   */
  it('Math.random이 1이면 최댓값이 지나야 resolve된다', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);

    const resolved = vi.fn();
    delayRandomSeconds(2, 5).then(resolved);

    await vi.advanceTimersByTimeAsync(5_000 - 1);
    expect(resolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toHaveBeenCalled();
  });

  it('Math.random이 0과 1 사이의 임의의 값이면 그 비율만큼 계산된 시간이 지나야 resolve된다', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const resolved = vi.fn();
    delayRandomSeconds(2, 5).then(resolved);

    await vi.advanceTimersByTimeAsync(3_500 - 1);
    expect(resolved).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(resolved).toHaveBeenCalled();
  });

  it('minSeconds가 maxSeconds보다 크면 에러를 던진다', () => {
    expect(() => delayRandomSeconds(5, 2)).toThrow('minSeconds는 maxSeconds보다 클 수 없습니다.');
  });
});
