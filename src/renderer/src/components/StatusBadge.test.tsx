import { expect, test } from 'vitest';
import StatusBadge from './StatusBadge';
import { customRender } from '../customRender';

test('normal이면 정상으로 보여준다', async () => {
  const screen = await customRender(<StatusBadge status="normal" />);

  await expect.element(screen.getByText('정상')).toBeVisible();
});

test('needUpdate이면 업데이트 필요로 보여준다', async () => {
  const screen = await customRender(<StatusBadge status="needUpdate" />);

  await expect.element(screen.getByText('업데이트 필요')).toBeVisible();
});

test('error이면 에러로 보여준다', async () => {
  const screen = await customRender(<StatusBadge status="error" />);

  await expect.element(screen.getByText('에러')).toBeVisible();
});
