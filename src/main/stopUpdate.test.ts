import { expect, it, vi } from 'vitest';
import createStopUpdate from './stopUpdate';
import type { UpdateScheduler } from './updateScheduler';

it('호출하면 넘겨받은 scheduler의 예약한 재실행을 취소한다', async () => {
  const mockCancelRestart = vi.fn();
  const fakeScheduler = { cancelRestart: mockCancelRestart } as unknown as UpdateScheduler;

  await createStopUpdate(fakeScheduler)();

  expect(mockCancelRestart).toHaveBeenCalledOnce();
});
