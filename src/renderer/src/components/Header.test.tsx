import { expect, test } from 'vitest';
import Header from './Header';
import { customRender } from '../customRender';

test('시맨틱 header(banner) 랜드마크로 렌더링된다', async () => {
  const screen = await customRender(<Header />);

  await expect.element(screen.getByRole('banner')).toBeVisible();
});

test('로고와 타이틀을 보여준다', async () => {
  const screen = await customRender(<Header />);

  await expect.element(screen.getByText('S')).toBeVisible();
  await expect
    .element(screen.getByRole('heading', { level: 1, name: /스마트스토어 최저가 봇/ }))
    .toBeVisible();
});

test('홈과 사용자 설정 버튼을 보여준다', async () => {
  const screen = await customRender(<Header />);

  await expect.element(screen.getByRole('button', { name: '홈' })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: '사용자 설정' })).toBeVisible();
});

test('홈 버튼만 현재 페이지로 표시한다', async () => {
  const screen = await customRender(<Header />);

  await expect
    .element(screen.getByRole('button', { name: '홈' }))
    .toHaveAttribute('aria-current', 'page');
  await expect
    .element(screen.getByRole('button', { name: '사용자 설정' }))
    .not.toHaveAttribute('aria-current');
});
