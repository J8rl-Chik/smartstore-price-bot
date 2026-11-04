import { beforeEach, expect, test, vi } from 'vitest';
import Header from './Header';
import { customRender } from '../customRender';
import type { Page } from '../domain/_type';

const mockOnChangePage = vi.fn<(page: Page) => void>();

beforeEach(() => {
  vi.resetAllMocks();
});

test('시맨틱 header(banner) 랜드마크로 렌더링된다', async () => {
  const screen = await customRender(<Header currentPage="home" onChangePage={mockOnChangePage} />);

  await expect.element(screen.getByRole('banner')).toBeVisible();
});

test('로고와 타이틀을 보여준다', async () => {
  const screen = await customRender(<Header currentPage="home" onChangePage={mockOnChangePage} />);

  await expect.element(screen.getByText('S')).toBeVisible();
  await expect
    .element(screen.getByRole('heading', { level: 1, name: /스마트스토어 최저가 봇/ }))
    .toBeVisible();
});

test('홈과 사용자 설정 버튼을 보여준다', async () => {
  const screen = await customRender(<Header currentPage="home" onChangePage={mockOnChangePage} />);

  await expect.element(screen.getByRole('button', { name: '홈' })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: '사용자 설정' })).toBeVisible();
});

test('현재 페이지가 home이면 홈 버튼만 현재 페이지로 표시한다', async () => {
  const screen = await customRender(<Header currentPage="home" onChangePage={mockOnChangePage} />);

  await expect
    .element(screen.getByRole('button', { name: '홈' }))
    .toHaveAttribute('aria-current', 'page');
  await expect
    .element(screen.getByRole('button', { name: '사용자 설정' }))
    .not.toHaveAttribute('aria-current');
});

test('현재 페이지가 settings이면 사용자 설정 버튼만 현재 페이지로 표시한다', async () => {
  const screen = await customRender(
    <Header currentPage="settings" onChangePage={mockOnChangePage} />,
  );

  await expect
    .element(screen.getByRole('button', { name: '사용자 설정' }))
    .toHaveAttribute('aria-current', 'page');
  await expect
    .element(screen.getByRole('button', { name: '홈' }))
    .not.toHaveAttribute('aria-current');
});

test('홈 버튼을 클릭하면 home으로 onChangePage를 호출한다', async () => {
  const screen = await customRender(
    <Header currentPage="settings" onChangePage={mockOnChangePage} />,
  );

  await screen.getByRole('button', { name: '홈' }).click();

  expect(mockOnChangePage).toHaveBeenCalledWith('home');
});

test('사용자 설정 버튼을 클릭하면 settings로 onChangePage를 호출한다', async () => {
  const screen = await customRender(<Header currentPage="home" onChangePage={mockOnChangePage} />);

  await screen.getByRole('button', { name: '사용자 설정' }).click();

  expect(mockOnChangePage).toHaveBeenCalledWith('settings');
});
