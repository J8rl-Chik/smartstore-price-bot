import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import createUpdateScheduler from './updateScheduler';

it('처음에는 순회를 막지 않는다', () => {
  const scheduler = createUpdateScheduler();

  expect(scheduler.isUpdateBlocked()).toBe(false);
});

it('lockUpdate하면 순회를 막고, unlockUpdate하면 다시 막지 않는다', () => {
  const scheduler = createUpdateScheduler();

  scheduler.lockUpdate();
  expect(scheduler.isUpdateBlocked()).toBe(true);

  scheduler.unlockUpdate();
  expect(scheduler.isUpdateBlocked()).toBe(false);
});

describe('재실행을 예약하면', () => {
  const delayMilliseconds = 30 * 60 * 1000;
  const restart = vi.fn();
  const onCancel = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    restart.mockReset();
    onCancel.mockReset();
  });

  it('기다리는 동안 순회를 막는다', () => {
    const scheduler = createUpdateScheduler();

    scheduler.scheduleRestart(delayMilliseconds, restart, onCancel);

    expect(scheduler.isUpdateBlocked()).toBe(true);
  });

  it('간격이 지나기 전에는 restart를 호출하지 않는다', () => {
    const scheduler = createUpdateScheduler();

    scheduler.scheduleRestart(delayMilliseconds, restart, onCancel);
    vi.advanceTimersByTime(delayMilliseconds - 1);

    expect(restart).not.toHaveBeenCalled();
  });

  it('간격이 지나면 순회를 막지 않는 상태로 restart를 호출한다', () => {
    const scheduler = createUpdateScheduler();
    // restart 안에서 다시 시작하는 순회가 막히지 않는지 보려고, 호출된 순간의 값을 기록한다.
    let isBlockedOnRestart: boolean | null = null;
    restart.mockImplementation(() => {
      isBlockedOnRestart = scheduler.isUpdateBlocked();
    });

    scheduler.scheduleRestart(delayMilliseconds, restart, onCancel);
    vi.advanceTimersByTime(delayMilliseconds);

    expect(restart).toHaveBeenCalledOnce();
    expect(isBlockedOnRestart).toBe(false);
  });

  it('재실행한 뒤에 cancelRestart하면 onCancel을 호출하지 않는다', () => {
    const scheduler = createUpdateScheduler();

    scheduler.scheduleRestart(delayMilliseconds, restart, onCancel);
    vi.advanceTimersByTime(delayMilliseconds);
    scheduler.cancelRestart();

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancelRestart하면 onCancel을 호출하고 restart는 호출하지 않는다', () => {
    const scheduler = createUpdateScheduler();

    scheduler.scheduleRestart(delayMilliseconds, restart, onCancel);
    scheduler.cancelRestart();
    vi.advanceTimersByTime(delayMilliseconds);

    expect(onCancel).toHaveBeenCalledOnce();
    expect(restart).not.toHaveBeenCalled();
  });

  it('cancelRestart하면 순회를 다시 막지 않는다', () => {
    const scheduler = createUpdateScheduler();

    scheduler.scheduleRestart(delayMilliseconds, restart, onCancel);
    scheduler.cancelRestart();

    expect(scheduler.isUpdateBlocked()).toBe(false);
  });

  it('cancelRestart를 두 번 호출해도 onCancel은 한 번만 호출한다', () => {
    const scheduler = createUpdateScheduler();

    scheduler.scheduleRestart(delayMilliseconds, restart, onCancel);
    scheduler.cancelRestart();
    scheduler.cancelRestart();

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
