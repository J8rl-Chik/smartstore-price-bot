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

test('자동 수정 시작 버튼을 보여준다', async () => {
  const screen = await customRender(<Header />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeVisible();
});
