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

test('네이버 계정 입력칸을 보여주고, 비밀번호는 가려서 입력받는다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect.element(screen.getByLabelText('네이버 아이디')).toHaveAttribute('type', 'text');
  await expect
    .element(screen.getByLabelText('네이버 비밀번호'))
    .toHaveAttribute('type', 'password');
});

test('스토어·커머스 API 입력칸을 보여주고, Client Secret은 가려서 입력받는다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect.element(screen.getByLabelText('내 스토어 이름')).toHaveAttribute('type', 'text');
  await expect.element(screen.getByLabelText('Client ID')).toHaveAttribute('type', 'text');
  await expect.element(screen.getByLabelText('Client Secret')).toHaveAttribute('type', 'password');
});

test('구글 시트 입력칸을 보여주고, 서비스 계정 키는 JSON 파일로 입력받는다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect.element(screen.getByLabelText('구글 시트 ID')).toHaveAttribute('type', 'text');
  await expect.element(screen.getByLabelText('시트 이름')).toHaveAttribute('type', 'text');

  const serviceAccountKeyInput = screen.getByLabelText('서비스 계정 키');

  await expect.element(serviceAccountKeyInput).toHaveAttribute('type', 'file');
  await expect.element(serviceAccountKeyInput).toHaveAttribute('accept', '.json');
});
