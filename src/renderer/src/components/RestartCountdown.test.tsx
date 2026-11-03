import { expect, test, vi } from 'vitest';
import RestartCountdown from './RestartCountdown';
import { customRender } from '../customRender';

test('재실행까지 남은 시간을 분:초로 보여준다', async () => {
  // 렌더링까지 1초 넘게 걸리지 않으면 남은 초를 올림해 30:00이 된다.
  const screen = await customRender(
    <RestartCountdown nextRunAt={Date.now() + 30 * 60 * 1000} onStopUpdate={vi.fn()} />,
  );

  await expect.element(screen.getByRole('status')).toHaveTextContent('다음 자동 수정까지 30:00');
});

test('중지 버튼을 클릭하면 onStopUpdate가 호출된다', async () => {
  const handleStopUpdate = vi.fn();
  const screen = await customRender(
    <RestartCountdown nextRunAt={Date.now() + 30 * 60 * 1000} onStopUpdate={handleStopUpdate} />,
  );

  await screen.getByRole('button', { name: '자동 재실행 중지' }).click();

  expect(handleStopUpdate).toHaveBeenCalledOnce();
});
