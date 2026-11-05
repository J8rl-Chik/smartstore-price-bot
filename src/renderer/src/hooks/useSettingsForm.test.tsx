import { beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useSettingsForm from './useSettingsForm';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import { MIN_PRODUCT_DELAY_SECONDS } from '../domain/parseProductDelay';
import { DEFAULT_SETTINGS, readSettings, saveSettings } from '../domain/settingsStorage';
import type { IpcInvoke, IpcListener } from '../../../preload/_type';
import type { Settings } from '../../../domain/settings/_type';

const mockEncryptSecret = vi.fn<IpcInvoke['encryptSecret']>();

window.api = {
  startUpdate: vi.fn<IpcInvoke['startUpdate']>(),
  stopUpdate: vi.fn<IpcInvoke['stopUpdate']>(),
  encryptSecret: mockEncryptSecret,
  onUpdateState: vi.fn<IpcListener['onUpdateState']>(),
};

beforeEach(() => {
  localStorage.clear();
  mockEncryptSecret.mockReset();
});

test('저장한 설정이 없으면 기본값으로 시작한다', async () => {
  const { result } = await renderHook(() => useSettingsForm());

  expect(result.current.form).toEqual({
    ...DEFAULT_SETTINGS,
    restartDelayMinutes: '',
    productDelaySeconds: String(MIN_PRODUCT_DELAY_SECONDS),
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

  await act(() => {
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

  await act(() => {
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

  await act(() => {
    result.current.changeSettingsForm('restartDelayMinutes', '1');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.errorMessages).toEqual({
    restartDelayMinutes: ERROR_MESSAGE.RESTART_DELAY_TOO_SHORT,
    productDelaySeconds: null,
  });
  expect(readSettings()).toEqual(settings);
});

test('상품 간 대기 시간이 잘못되면 실패 이유를 알려주고 저장하지 않는다', async () => {
  saveSettings(settings);

  const { result, act } = await renderHook(() => useSettingsForm());

  await act(() => {
    result.current.changeSettingsForm('productDelaySeconds', '1');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.errorMessages).toEqual({
    restartDelayMinutes: null,
    productDelaySeconds: ERROR_MESSAGE.PRODUCT_DELAY_TOO_SHORT,
  });
  expect(readSettings()).toEqual(settings);
});

test('두 입력이 모두 잘못되면 실패 이유를 모두 알려준다', async () => {
  const { result, act } = await renderHook(() => useSettingsForm());

  await act(() => {
    result.current.changeSettingsForm('restartDelayMinutes', '10.5');
    result.current.changeSettingsForm('productDelaySeconds', '10.5');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(result.current.errorMessages).toEqual({
    restartDelayMinutes: ERROR_MESSAGE.RESTART_DELAY_NOT_INTEGER,
    productDelaySeconds: ERROR_MESSAGE.PRODUCT_DELAY_NOT_INTEGER,
  });
});

test('잘못된 입력을 고쳐 다시 저장하면 실패 이유를 지우고 저장한다', async () => {
  const { result, act } = await renderHook(() => useSettingsForm());

  await act(() => {
    result.current.changeSettingsForm('restartDelayMinutes', '1');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });
  await act(() => {
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

  await act(() => {
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

  await act(() => {
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

  await act(() => {
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

  await act(() => {
    result.current.changeSettingsForm('restartDelayMinutes', '1');
    result.current.changeSecretInput('naverPassword', 'new-password');
  });
  await act(async () => {
    await result.current.saveSettingsForm();
  });

  expect(mockEncryptSecret).not.toHaveBeenCalled();
});
