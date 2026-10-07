import { expect, test } from 'vitest';
import ProgressBar from './ProgressBar';
import { customRender } from '../customRender';

test('수정 중인 상품 이름과 진행 카운트를 보여준다', async () => {
  const screen = await customRender(<ProgressBar total={108} current={63} productName="상품A" />);

  await expect.element(screen.getByText('상품A')).toBeVisible();
  await expect.element(screen.getByText('63 / 108 확인 중')).toBeVisible();
});

test('상품 이름이 없으면 대기 중으로 보여준다', async () => {
  const screen = await customRender(<ProgressBar total={108} current={0} />);

  await expect.element(screen.getByText('대기 중')).toBeVisible();
  await expect.element(screen.getByText('0 / 108 확인 중')).toBeVisible();
});

test('진행률을 전달받은 current와 total에 반영한다', async () => {
  const screen = await customRender(<ProgressBar total={108} current={63} productName="상품A" />);

  const progressbar = screen.getByRole('progressbar');

  await expect.element(progressbar).toBeVisible();
  await expect.element(progressbar).toHaveAttribute('value', '63');
  await expect.element(progressbar).toHaveAttribute('max', '108');
});
