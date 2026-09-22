import { expect, test } from 'vitest';
import ProgressBar from './ProgressBar';
import { customRender } from '../customRender';

test('상태 텍스트와 진행 카운트를 보여준다', async () => {
  const screen = await customRender(<ProgressBar />);

  await expect.element(screen.getByText('대기 중')).toBeVisible();
  await expect.element(screen.getByText('63 / 108 확인 중')).toBeVisible();
});

test('진행률을 63/108 기준으로 반영한다', async () => {
  const screen = await customRender(<ProgressBar />);

  const progressbar = screen.getByRole('progressbar');

  await expect.element(progressbar).toBeVisible();
  await expect.element(progressbar).toHaveAttribute('value', '63');
  await expect.element(progressbar).toHaveAttribute('max', '108');
});
