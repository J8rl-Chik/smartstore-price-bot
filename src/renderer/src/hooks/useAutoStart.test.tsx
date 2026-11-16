import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useAutoStart from './useAutoStart';
import { saveSettings } from '../domain/settingsStorage';
import type { IpcInvoke, IpcListener } from '../../../preload/_type';
import type { Settings } from '../../../domain/settings/_type';

const mockStartUpdate = vi.fn<IpcInvoke['startUpdate']>();
const mockIsOpenedAtLogin = vi.fn<IpcInvoke['isOpenedAtLogin']>();

window.api = {
  startUpdate: mockStartUpdate,
  stopUpdate: vi.fn<IpcInvoke['stopUpdate']>(),
  encryptSecret: vi.fn<IpcInvoke['encryptSecret']>(),
  isOpenAtLoginEnabled: vi.fn<IpcInvoke['isOpenAtLoginEnabled']>(),
  setOpenAtLogin: vi.fn<IpcInvoke['setOpenAtLogin']>(),
  isOpenedAtLogin: mockIsOpenedAtLogin,
  onUpdateState: vi.fn<IpcListener['onUpdateState']>(),
};

const startTime = 1700000000000;

// 필수 설정이 모두 있어 시작할 수 있는 설정
const settings: Settings = {
  naverId: 'naver-id',
  storeName: '내 스토어',
  clientId: 'client-id',
  sheetId: 'sheet-id',
  sheetName: '상품 목록',
  restartDelayMinutes: 30,
  productDelaySeconds: 20,
  autoStartDelayMinutes: 3,
  isDryRun: true,
  encryptedNaverPassword: 'encrypted-password',
  encryptedClientSecret: 'encrypted-client-secret',
  encryptedServiceAccountKey: 'encrypted-key',
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(startTime);
  localStorage.clear();
  saveSettings(settings);
  mockStartUpdate.mockReset().mockResolvedValue(undefined);
  // 기본은 Windows 시작 프로그램으로 켜진 상태로 둔다.
  mockIsOpenedAtLogin.mockReset().mockResolvedValue(true);
});

afterEach(() => {
  vi.useRealTimers();
});

test('시작 프로그램으로 켜졌으면 저장한 시작 대기 시간 뒤로 자동 시작을 예약한다', async () => {
  const { result, act } = await renderHook(() => useAutoStart());

  await act(async () => {});

  expect(result.current.autoStartAt).toBe(startTime + 3 * 60 * 1000);
});

test('바로가기로 켰으면 자동 시작을 예약하지 않는다', async () => {
  mockIsOpenedAtLogin.mockResolvedValue(false);

  const { result, act } = await renderHook(() => useAutoStart());

  await act(async () => {});

  expect(result.current.autoStartAt).toBeNull();
});

test('시작 프로그램으로 켜졌는지 확인하지 못하면 자동 시작을 예약하지 않는다', async () => {
  mockIsOpenedAtLogin.mockRejectedValue(new Error('IPC 실패'));

  const { result, act } = await renderHook(() => useAutoStart());

  await act(async () => {});

  expect(result.current.autoStartAt).toBeNull();
});

test('필수 설정이 없으면 자동 시작을 예약하지 않는다', async () => {
  saveSettings({ ...settings, naverId: '' });

  const { result, act } = await renderHook(() => useAutoStart());

  await act(async () => {});

  expect(result.current.autoStartAt).toBeNull();
});

test('예약 시각이 되기 전에는 시작하지 않는다', async () => {
  const { act } = await renderHook(() => useAutoStart());

  await act(async () => {});
  await act(async () => {
    vi.advanceTimersByTime(3 * 60 * 1000 - 1);
  });

  expect(mockStartUpdate).not.toHaveBeenCalled();
});

test('예약 시각이 되면 저장한 설정으로 시작하고 예약을 지운다', async () => {
  const { result, act } = await renderHook(() => useAutoStart());

  await act(async () => {});
  await act(async () => {
    vi.advanceTimersByTime(3 * 60 * 1000);
  });

  expect(mockStartUpdate).toHaveBeenCalledWith(settings);
  expect(result.current.autoStartAt).toBeNull();
});

test('시작 대기 시간이 0분이면 예약하자마자 시작한다', async () => {
  saveSettings({ ...settings, autoStartDelayMinutes: 0 });

  const { act } = await renderHook(() => useAutoStart());

  await act(async () => {});
  await act(async () => {
    vi.advanceTimersByTime(0);
  });

  expect(mockStartUpdate).toHaveBeenCalledOnce();
});

test('자동 시작을 취소하면 예약 시각이 지나도 시작하지 않는다', async () => {
  const { result, act } = await renderHook(() => useAutoStart());

  await act(async () => {});
  await act(async () => {
    result.current.cancelAutoStart();
  });
  await act(async () => {
    vi.advanceTimersByTime(3 * 60 * 1000);
  });

  expect(result.current.autoStartAt).toBeNull();
  expect(mockStartUpdate).not.toHaveBeenCalled();
});

test('언마운트하면 예약 시각이 지나도 시작하지 않는다', async () => {
  const { act, unmount } = await renderHook(() => useAutoStart());

  await act(async () => {});
  await unmount();

  vi.advanceTimersByTime(3 * 60 * 1000);

  expect(mockStartUpdate).not.toHaveBeenCalled();
});
