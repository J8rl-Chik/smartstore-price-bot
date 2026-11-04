import { expect, test } from 'vitest';
import SettingsPage from './SettingsPage';
import { customRender } from '../customRender';

test('사용자 설정 제목을 보여준다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect
    .element(screen.getByRole('heading', { level: 2, name: '사용자 설정' }))
    .toBeVisible();
});

test('설정 섹션 4개를 보여준다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect
    .element(screen.getByRole('heading', { level: 3, name: '네이버 계정' }))
    .toBeVisible();
  await expect
    .element(screen.getByRole('heading', { level: 3, name: '스토어 · 커머스 API' }))
    .toBeVisible();
  await expect.element(screen.getByRole('heading', { level: 3, name: '구글 시트' })).toBeVisible();
  await expect.element(screen.getByRole('heading', { level: 3, name: '실행' })).toBeVisible();
});

test('구글 시트 설명은 읽기 전용 권한에 맞게 보여준다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect.element(screen.getByText('상품 목록을 읽어올 시트예요.')).toBeVisible();
});
