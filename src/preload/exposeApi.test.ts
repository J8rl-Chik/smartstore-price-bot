import { afterEach, describe, expect, it, vi } from 'vitest';
import { exposeApi } from './exposeApi';
import type { IpcEvent } from './ipcEvent';

// preload가 renderer에 노출하는 api의 형태. 채널 이름과 반환 타입은 IpcEvent에서 파생한다.
type Api = { [Channel in keyof IpcEvent]: () => Promise<IpcEvent[Channel]['returnType']> };

const mockInvoke = vi.fn();
const mockExposeInMainWorld = vi.fn();
// vi.mock 팩토리는 import보다 먼저 호이스팅되므로, 팩토리가 참조하는 값도 vi.hoisted로 먼저 만든다.
const { fakeElectronAPI } = vi.hoisted(() => ({
  fakeElectronAPI: { name: 'fake-electron-api' },
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (...args: unknown[]) => mockExposeInMainWorld(...args),
  },
  ipcRenderer: { invoke: (...args: unknown[]) => mockInvoke(...args) },
}));

vi.mock('@electron-toolkit/preload', () => ({
  electronAPI: fakeElectronAPI,
}));

const setContextIsolated = (value: boolean): void => {
  Object.defineProperty(process, 'contextIsolated', { value, configurable: true });
};

// exposeApi()를 실행한 뒤, exposeInMainWorld('api', api)로 노출된 api 객체를 꺼낸다.
const getExposedApi = (): Api => {
  exposeApi();

  const call = mockExposeInMainWorld.mock.calls.find(([key]) => key === 'api');

  if (!call) {
    throw new Error('api가 노출되지 않았습니다.');
  }

  const [, api] = call;

  return api;
};

describe('exposeApi', () => {
  afterEach(() => {
    mockInvoke.mockReset();
    mockExposeInMainWorld.mockReset();
    Reflect.deleteProperty(process, 'contextIsolated');
  });

  it('contextIsolated가 켜져 있으면 electron과 api를 renderer에 노출한다', () => {
    setContextIsolated(true);

    exposeApi();

    expect(mockExposeInMainWorld).toHaveBeenCalledWith('electron', fakeElectronAPI);
    expect(mockExposeInMainWorld).toHaveBeenCalledWith('api', expect.any(Object));
  });

  it('createLoginPage를 호출하면 createLoginPage 채널로 invoke를 호출하고 결과를 반환한다', async () => {
    setContextIsolated(true);
    mockInvoke.mockResolvedValue('createLoginPage 결과');

    const api = getExposedApi();
    const result = await api.createLoginPage();

    expect(mockInvoke).toHaveBeenCalledWith('createLoginPage');
    expect(result).toBe('createLoginPage 결과');
  });

  it('getSaleProducts를 호출하면 getSaleProducts 채널로 invoke를 호출하고 결과를 반환한다', async () => {
    setContextIsolated(true);
    mockInvoke.mockResolvedValue('getSaleProducts 결과');

    const api = getExposedApi();
    const result = await api.getSaleProducts();

    expect(mockInvoke).toHaveBeenCalledWith('getSaleProducts');
    expect(result).toBe('getSaleProducts 결과');
  });

  it('getProductRows를 호출하면 getProductRows 채널로 invoke를 호출하고 결과를 반환한다', async () => {
    setContextIsolated(true);
    mockInvoke.mockResolvedValue('getProductRows 결과');

    const api = getExposedApi();
    const result = await api.getProductRows();

    expect(mockInvoke).toHaveBeenCalledWith('getProductRows');
    expect(result).toBe('getProductRows 결과');
  });

  it('getTargetProducts를 호출하면 getTargetProducts 채널로 invoke를 호출하고 결과를 반환한다', async () => {
    setContextIsolated(true);
    mockInvoke.mockResolvedValue('getTargetProducts 결과');

    const api = getExposedApi();
    const result = await api.getTargetProducts();

    expect(mockInvoke).toHaveBeenCalledWith('getTargetProducts');
    expect(result).toBe('getTargetProducts 결과');
  });

  it('contextBridge 노출 중 예외가 발생하면 콘솔에 로깅한다', () => {
    setContextIsolated(true);

    const error = new Error('노출 실패');
    mockExposeInMainWorld.mockImplementation(() => {
      throw error;
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    exposeApi();

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);

    consoleErrorSpy.mockRestore();
  });
});
