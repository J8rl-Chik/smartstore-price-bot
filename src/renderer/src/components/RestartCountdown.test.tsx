import { expect, test } from 'vitest';
import RestartCountdown from './RestartCountdown';
import { customRender } from '../customRender';

test('재실행까지 남은 시간을 분:초로 보여준다', async () => {
  // 렌더링까지 1초 넘게 걸리지 않으면 남은 초를 올림해 30:00이 된다.
  const screen = await customRender(<RestartCountdown nextRunAt={Date.now() + 30 * 60 * 1000} />);

  await expect.element(screen.getByRole('status')).toHaveTextContent('다음 자동 수정까지 30:00');
});
