import { beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useSettingsForm from './useSettingsForm';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import { MIN_PRODUCT_DELAY_SECONDS } from '../domain/parseProductDelay';
import { DEFAULT_SETTINGS, readSettings, saveSettings } from '../domain/settingsStorage';
import type { IpcInvoke, IpcListener } from '../../../preload/_type';
import type { Settings } from '../../../domain/settings/_type';

const mockEncryptSecret = vi.fn<IpcInvoke['encryptSecret']>();
const mockIsOpenAtLoginEnabled = vi.fn<IpcInvoke['isOpenAtLoginEnabled']>();
const mockSetOpenAtLogin = vi.fn<IpcInvoke['setOpenAtLogin']>();

window.api = {
  startUpdate: vi.fn<IpcInvoke['startUpdate']>(),
  stopUpdate: vi.fn<IpcInvoke['stopUpdate']>(),
  encryptSecret: mockEncryptSecret,
  isOpenAtLoginEnabled: mockIsOpenAtLoginEnabled,
  setOpenAtLogin: mockSetOpenAtLogin,
  isOpenedAtLogin: vi.fn<IpcInvoke['isOpenedAtLogin']>(),
  onUpdateState: vi.fn<IpcListener['onUpdateState']>(),
};

beforeEach(() => {
  localStorage.clear();
  mockEncryptSecret.mockReset();
  // 시작 프로그램에 등록돼 있지 않은 상태로 시작한다.
  mockIsOpenAtLoginEnabled.mockReset().mockResolvedValue(false);
  mockSetOpenAtLogin.mockReset().mockResolvedValue(undefined);
});

test('저장한 설정이 없으면 기본값으로 시작한다', async () => {
  const { result } = await renderHook(() => useSettingsForm());

  expect(result.current.form).toEqual({
    ...DEFAULT_SETTINGS,
    restartDelayMinutes: '',
    productDelaySeconds: String(MIN_PRODUCT_DELAY_SECONDS),
    autoStartDelayMinutes: String(DEFAULT_SETTINGS.autoStartDelayMinutes),
  });
});

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

test('저장한 설정으로 시작하고, 숫자는 입력칸에 넣을 문자열로 바꾼다', async () => {
  saveSettings(settings);

  const { result } = await renderHook(() => useSettingsForm());

  expect(result.current.form).toEqual({
    ...settings,
    restartDelayMinutes: '30',
    productDelaySeconds: '20',
    autoStartDelayMinutes: '3',
  });
});

test('입력을 바꾸면 해당 항목만 바뀌고 저장하기 전에는 저장값이 그대로다', async () => {
  saveSettings(settings);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(() => {
    result.current.changeSettingsForm('naverId', 'new-id');
  });

  expect(result.current.form.naverId).toBe('new-id');
  expect(result.current.form.storeName).toBe(settings.storeName);
  expect(readSettings()).toEqual(settings);
});

test('저장하면 입력값을 숫자로 바꿔 저장한다', async () => {
  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('naverId', 'new-id');
    result.current.changeSettingsForm('restartDelayMinutes', '30');
    result.current.changeSettingsForm('productDelaySeconds', '20');
    result.current.changeSettingsForm('isDryRun', true);
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(readSettings()).toEqual({
    ...DEFAULT_SETTINGS,
    naverId: 'new-id',
    restartDelayMinutes: 30,
    productDelaySeconds: 20,
    isDryRun: true,
  });
});

test('순회 간격을 비우고 저장하면 null로 저장한다', async () => {
  saveSettings(settings);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('restartDelayMinutes', '');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(readSettings().restartDelayMinutes).toBeNull();
});

test('순회 간격이 잘못되면 실패 이유를 알려주고 저장하지 않는다', async () => {
  saveSettings(settings);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('restartDelayMinutes', '0');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.errorMessages).toEqual({
    restartDelayMinutes: ERROR_MESSAGE.RESTART_DELAY_TOO_SHORT,
    productDelaySeconds: null,
    autoStartDelayMinutes: null,
  });
  expect(readSettings()).toEqual(settings);
});

test('상품 간 대기 시간이 잘못되면 실패 이유를 알려주고 저장하지 않는다', async () => {
  saveSettings(settings);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('productDelaySeconds', '1');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.errorMessages).toEqual({
    restartDelayMinutes: null,
    productDelaySeconds: ERROR_MESSAGE.PRODUCT_DELAY_TOO_SHORT,
    autoStartDelayMinutes: null,
  });
  expect(readSettings()).toEqual(settings);
});

test('두 입력이 모두 잘못되면 실패 이유를 모두 알려준다', async () => {
  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('restartDelayMinutes', '10.5');
    result.current.changeSettingsForm('productDelaySeconds', '10.5');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.errorMessages).toEqual({
    restartDelayMinutes: ERROR_MESSAGE.RESTART_DELAY_NOT_INTEGER,
    productDelaySeconds: ERROR_MESSAGE.PRODUCT_DELAY_NOT_INTEGER,
    autoStartDelayMinutes: null,
  });
});

test('잘못된 입력을 고쳐 다시 저장하면 실패 이유를 지우고 저장한다', async () => {
  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('restartDelayMinutes', '0');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });
  await act(async () => {
    result.current.changeSettingsForm('restartDelayMinutes', '30');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.errorMessages.restartDelayMinutes).toBeNull();
  expect(readSettings().restartDelayMinutes).toBe(30);
});

test('비밀값을 입력하고 저장하면 암호문만 저장하고 입력값을 비운다', async () => {
  mockEncryptSecret.mockImplementation(async (secret) => `encrypted:${secret}`);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSecretInput('naverPassword', 'plain-password');
    result.current.changeSecretInput('clientSecret', 'plain-client-secret');
    result.current.changeSecretInput('serviceAccountKey', 'plain-key');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(readSettings()).toMatchObject({
    encryptedNaverPassword: 'encrypted:plain-password',
    encryptedClientSecret: 'encrypted:plain-client-secret',
    encryptedServiceAccountKey: 'encrypted:plain-key',
  });
  expect(Object.keys(readSettings())).not.toContain('naverPassword');
  expect(result.current.form.encryptedNaverPassword).toBe('encrypted:plain-password');
  expect(result.current.secretInputs).toEqual({
    naverPassword: '',
    clientSecret: '',
    serviceAccountKey: '',
  });
});

test('비밀값을 입력하지 않고 저장하면 저장해 둔 암호문을 유지한다', async () => {
  saveSettings(settings);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(mockEncryptSecret).not.toHaveBeenCalled();
  expect(readSettings()).toEqual(settings);
});

test('입력한 비밀값만 암호화하고 나머지 암호문은 유지한다', async () => {
  saveSettings(settings);
  mockEncryptSecret.mockResolvedValue('new-encrypted-password');

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSecretInput('naverPassword', 'new-password');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(mockEncryptSecret).toHaveBeenCalledOnce();
  expect(readSettings()).toEqual({
    ...settings,
    encryptedNaverPassword: 'new-encrypted-password',
  });
});

test('암호화에 실패하면 실패 이유를 알려주고 아무것도 저장하지 않는다', async () => {
  saveSettings(settings);
  mockEncryptSecret.mockRejectedValue(new Error('암호화 실패'));

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('naverId', 'new-id');
    result.current.changeSecretInput('naverPassword', 'new-password');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.saveErrorMessage).toBe(ERROR_MESSAGE.ENCRYPTION_UNAVAILABLE);
  expect(result.current.secretInputs.naverPassword).toBe('new-password');
  expect(readSettings()).toEqual(settings);
});

test('입력 검사에 실패하면 비밀값을 암호화하지 않는다', async () => {
  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('restartDelayMinutes', '0');
    result.current.changeSecretInput('naverPassword', 'new-password');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(mockEncryptSecret).not.toHaveBeenCalled();
});

test('시작 프로그램에 등록돼 있지 않으면 자동 실행 토글이 꺼진 상태로 시작한다', async () => {
  const { result, act } = await renderHook(() => useSettingsForm());

  await act(() => {});

  expect(mockIsOpenAtLoginEnabled).toHaveBeenCalled();
  expect(result.current.isOpenAtLogin).toBe(false);
});

test('시작 프로그램에 등록돼 있으면 자동 실행 토글이 켜진 상태가 된다', async () => {
  mockIsOpenAtLoginEnabled.mockResolvedValue(true);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(() => {});

  expect(result.current.isOpenAtLogin).toBe(true);
});

test('등록 여부를 읽지 못하면 자동 실행 토글을 꺼진 상태로 둔다', async () => {
  mockIsOpenAtLoginEnabled.mockRejectedValue(new Error('IPC 실패'));

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(() => {});

  expect(mockIsOpenAtLoginEnabled).toHaveBeenCalled();
  expect(result.current.isOpenAtLogin).toBe(false);
});

test('자동 실행 토글을 바꿔도 저장하기 전에는 시작 프로그램 등록을 바꾸지 않는다', async () => {
  const { result, act } = await renderHook(() => useSettingsForm());

  await act(() => {
    result.current.changeOpenAtLogin(true);
  });

  expect(result.current.isOpenAtLogin).toBe(true);
  expect(mockSetOpenAtLogin).not.toHaveBeenCalled();
});

test('자동 실행을 켜고 저장하면 시작 프로그램에 등록하고 시작 대기 시간을 숫자로 저장한다', async () => {
  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeOpenAtLogin(true);
    result.current.changeSettingsForm('autoStartDelayMinutes', '10');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(mockSetOpenAtLogin).toHaveBeenCalledWith(true);
  expect(readSettings().autoStartDelayMinutes).toBe(10);
});

test('자동 실행을 끄고 저장하면 시작 프로그램에서 해제한다', async () => {
  mockIsOpenAtLoginEnabled.mockResolvedValue(true);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {});

  expect(result.current.isOpenAtLogin).toBe(true);

  await act(async () => {
    result.current.changeOpenAtLogin(false);
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(mockSetOpenAtLogin).toHaveBeenCalledWith(false);
});

test('자동 실행이 켜져 있을 때 시작 대기 시간이 잘못되면 실패 이유를 알려주고 아무것도 저장하지 않는다', async () => {
  saveSettings(settings);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeOpenAtLogin(true);
    result.current.changeSettingsForm('autoStartDelayMinutes', '61');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.errorMessages).toEqual({
    restartDelayMinutes: null,
    productDelaySeconds: null,
    autoStartDelayMinutes: ERROR_MESSAGE.AUTO_START_DELAY_OUT_OF_RANGE,
  });
  expect(readSettings()).toEqual(settings);
  expect(mockSetOpenAtLogin).not.toHaveBeenCalled();
});

test('자동 실행이 꺼져 있으면 시작 대기 시간을 검사하지 않고 저장해 둔 값을 유지한다', async () => {
  saveSettings(settings);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('autoStartDelayMinutes', '');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.errorMessages.autoStartDelayMinutes).toBeNull();
  expect(readSettings().autoStartDelayMinutes).toBe(settings.autoStartDelayMinutes);
});

test('시작 프로그램 등록에 실패하면 실패 이유를 알려주고 나머지 설정은 저장한다', async () => {
  mockSetOpenAtLogin.mockRejectedValue(new Error('등록 실패'));

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeSettingsForm('naverId', 'new-id');
    result.current.changeOpenAtLogin(true);
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.saveErrorMessage).toBe(ERROR_MESSAGE.OPEN_AT_LOGIN_FAILED);
  expect(readSettings().naverId).toBe('new-id');
});

test('암호화에 실패하면 시작 프로그램 등록을 바꾸지 않는다', async () => {
  mockEncryptSecret.mockRejectedValue(new Error('암호화 실패'));

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(async () => {
    result.current.changeOpenAtLogin(true);
    result.current.changeSecretInput('naverPassword', 'new-password');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(mockSetOpenAtLogin).not.toHaveBeenCalled();
});
