import { act } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import App from './App';
import { saveSettings } from './domain/settingsStorage';
import type { UpdateState } from '../../domain/product/_type';
import type { IpcInvoke, IpcListener } from '../../preload/_type';
import type { Settings } from '../../domain/settings/_type';

const mockStartUpdate = vi.fn<IpcInvoke['startUpdate']>();
const mockStopUpdate = vi.fn<IpcInvoke['stopUpdate']>();
const mockOnUpdateState = vi.fn<IpcListener['onUpdateState']>();

window.api = {
  startUpdate: mockStartUpdate,
  stopUpdate: mockStopUpdate,
  encryptSecret: vi.fn<IpcInvoke['encryptSecret']>(),
  onUpdateState: mockOnUpdateState,
};

const updateState: UpdateState = {
  targetProducts: [],
  invalidProductRows: [],
  currentIndex: null,
  isPreparing: false,
  isRunning: false,
  errorMessage: null,
  nextRunAt: null,
};

// 구독하자마자 main이 state를 보낸 것처럼 콜백을 바로 호출한다.
const mockSentUpdateState = (state: UpdateState): void => {
  mockOnUpdateState.mockImplementation((callback) => {
    callback(state);
    return vi.fn();
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();

  mockSentUpdateState(updateState);
});

test('main이 보낸 상태를 홈 화면에 보여준다', async () => {
  mockSentUpdateState({ ...updateState, errorMessage: '스프레드시트 조회 실패' });

  const screen = await render(<App />);

  await expect.element(screen.getByText('스프레드시트 조회 실패')).toBeVisible();
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
  encryptedNaverPassword: 'encrypted-password',
  encryptedClientSecret: 'encrypted-client-secret',
  encryptedServiceAccountKey: 'encrypted-key',
};

test('시작 버튼을 클릭하면 저장한 설정으로 시작한다', async () => {
  saveSettings(settings);

  const screen = await render(<App />);

  await screen.getByRole('button', { name: '자동 수정 시작' }).click();

  expect(mockStartUpdate).toHaveBeenCalledWith(settings);
});

test('중지 버튼을 클릭하면 window.api.stopUpdate를 호출한다', async () => {
  mockSentUpdateState({ ...updateState, nextRunAt: Date.now() + 30 * 60 * 1000 });

  const screen = await render(<App />);
  await screen.getByRole('button', { name: '자동 재실행 중지' }).click();

  expect(mockStopUpdate).toHaveBeenCalledOnce();
});

test('처음에는 홈 화면을 보여준다', async () => {
  const screen = await render(<App />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeVisible();
  await expect
    .element(screen.getByRole('heading', { level: 2, name: '사용자 설정' }))
    .not.toBeInTheDocument();
});

test('사용자 설정 버튼을 클릭하면 설정 화면으로 바뀐다', async () => {
  const screen = await render(<App />);

  await screen.getByRole('button', { name: '사용자 설정' }).click();

  await expect
    .element(screen.getByRole('heading', { level: 2, name: '사용자 설정' }))
    .toBeVisible();
  await expect
    .element(screen.getByRole('button', { name: '자동 수정 시작' }))
    .not.toBeInTheDocument();
});

test('홈 버튼을 클릭하면 홈 화면으로 돌아온다', async () => {
  const screen = await render(<App />);

  await screen.getByRole('button', { name: '사용자 설정' }).click();
  await screen.getByRole('button', { name: '홈' }).click();

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeVisible();
});

test('설정 화면에 있는 동안 main이 보낸 상태를 홈으로 돌아오면 보여준다', async () => {
  const screen = await render(<App />);
  const [sendUpdateState] = mockOnUpdateState.mock.calls[0];

  await screen.getByRole('button', { name: '사용자 설정' }).click();
  act(() => sendUpdateState({ ...updateState, errorMessage: '스프레드시트 조회 실패' }));
  await screen.getByRole('button', { name: '홈' }).click();

  await expect.element(screen.getByText('스프레드시트 조회 실패')).toBeVisible();
});
