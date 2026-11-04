import { beforeEach, expect, test } from 'vitest';
import SettingsPage from './SettingsPage';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import { customRender } from '../customRender';
import { MIN_PRODUCT_DELAY_SECONDS } from '../domain/parseProductDelay';
import { DEFAULT_SETTINGS, readSettings, saveSettings } from '../domain/settingsStorage';
import type { Settings } from '../../../domain/settings/_type';

beforeEach(() => {
  localStorage.clear();
});

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

test('순회 간격은 비어 있고, 비우면 한 번만 순회한다고 안내한다', async () => {
  const screen = await customRender(<SettingsPage />);

  const restartDelayInput = screen.getByLabelText(/순회 간격/);

  await expect.element(restartDelayInput).toHaveValue(null);
  await expect.element(restartDelayInput).toHaveAttribute('placeholder', '비우면 한 번만');
});

test('상품 간 대기 시간은 최솟값을 기본값으로 보여준다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect
    .element(screen.getByLabelText(/상품 간 대기 시간/))
    .toHaveValue(MIN_PRODUCT_DELAY_SECONDS);
});

test('테스트 모드는 꺼져 있고, 켜면 실제 가격을 수정하지 않는다고 안내한다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect.element(screen.getByRole('switch', { name: /테스트 모드/ })).not.toBeChecked();
  await expect.element(screen.getByText('켜면 실제 가격을 수정하지 않아요.')).toBeVisible();
});

test('저장 버튼을 보여준다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect.element(screen.getByRole('button', { name: '저장' })).toBeVisible();
});

const settings: Settings = {
  naverId: 'naver-id',
  storeName: '내 스토어',
  clientId: 'client-id',
  sheetId: 'sheet-id',
  sheetName: '상품 목록',
  restartDelayMinutes: 30,
  productDelaySeconds: 20,
  isDryRun: true,
};

test('저장한 설정을 입력칸에 보여준다', async () => {
  saveSettings(settings);

  const screen = await customRender(<SettingsPage />);

  await expect.element(screen.getByLabelText('네이버 아이디')).toHaveValue('naver-id');
  await expect.element(screen.getByLabelText('내 스토어 이름')).toHaveValue('내 스토어');
  await expect.element(screen.getByLabelText('Client ID')).toHaveValue('client-id');
  await expect.element(screen.getByLabelText('구글 시트 ID')).toHaveValue('sheet-id');
  await expect.element(screen.getByLabelText('시트 이름')).toHaveValue('상품 목록');
  await expect.element(screen.getByLabelText(/순회 간격/)).toHaveValue(30);
  await expect.element(screen.getByLabelText(/상품 간 대기 시간/)).toHaveValue(20);
  await expect.element(screen.getByRole('switch', { name: /테스트 모드/ })).toBeChecked();
});

test('입력하고 저장 버튼을 클릭하면 입력값을 저장한다', async () => {
  const screen = await customRender(<SettingsPage />);

  await screen.getByLabelText('네이버 아이디').fill('naver-id');
  await screen.getByLabelText('내 스토어 이름').fill('내 스토어');
  await screen.getByLabelText('Client ID').fill('client-id');
  await screen.getByLabelText('구글 시트 ID').fill('sheet-id');
  await screen.getByLabelText('시트 이름').fill('상품 목록');
  await screen.getByLabelText(/순회 간격/).fill('30');
  await screen.getByLabelText(/상품 간 대기 시간/).fill('20');
  await screen.getByText('꺼짐').click();
  await screen.getByRole('button', { name: '저장' }).click();

  expect(readSettings()).toEqual(settings);
});

test('테스트 모드를 클릭하면 켜짐으로 바뀐다', async () => {
  const screen = await customRender(<SettingsPage />);

  await screen.getByText('꺼짐').click();

  await expect.element(screen.getByRole('switch', { name: /테스트 모드/ })).toBeChecked();
  await expect.element(screen.getByText('켜짐')).toBeVisible();
});

test('순회 간격이 잘못되면 실패 이유를 보여주고 저장하지 않는다', async () => {
  const screen = await customRender(<SettingsPage />);

  await screen.getByLabelText(/순회 간격/).fill('1');
  await screen.getByRole('button', { name: '저장' }).click();

  await expect.element(screen.getByText(ERROR_MESSAGE.RESTART_DELAY_TOO_SHORT)).toBeVisible();
  expect(readSettings()).toEqual(DEFAULT_SETTINGS);
});

test('상품 간 대기 시간이 잘못되면 실패 이유를 보여주고 저장하지 않는다', async () => {
  const screen = await customRender(<SettingsPage />);

  await screen.getByLabelText(/상품 간 대기 시간/).fill('1');
  await screen.getByRole('button', { name: '저장' }).click();

  await expect.element(screen.getByText(ERROR_MESSAGE.PRODUCT_DELAY_TOO_SHORT)).toBeVisible();
  expect(readSettings()).toEqual(DEFAULT_SETTINGS);
});
