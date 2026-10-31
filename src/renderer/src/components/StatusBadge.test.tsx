import { expect, test } from 'vitest';
import StatusBadge from './StatusBadge';
import { customRender } from '../customRender';

test('wait이면 대기로 보여준다', async () => {
  const screen = await customRender(<StatusBadge status="wait" />);

  await expect.element(screen.getByText('대기')).toBeVisible();
});

test('complete이면 완료로 보여준다', async () => {
  const screen = await customRender(<StatusBadge status="complete" />);

  await expect.element(screen.getByText('완료')).toBeVisible();
});

test('error이면 에러로 보여준다', async () => {
  const screen = await customRender(<StatusBadge status="error" />);

  await expect.element(screen.getByText('에러')).toBeVisible();
});
