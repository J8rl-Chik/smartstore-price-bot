import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IpcEvent } from './ipcEvent';

// preload가 renderer에 노출하는 api의 형태. 채널 이름과 반환 타입은 IpcEvent에서 파생한다.
type Api = { [Channel in keyof IpcEvent]: () => Promise<IpcEvent[Channel]['returnType']> };

const mockInvoke = vi.fn();
const mockExposeInMainWorld = vi.fn();
const fakeElectronAPI = { name: 'fake-electron-api' };

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

// preload 모듈은 import되는 순간 바로 실행되므로, 매번 모듈 캐시를 비우고 다시 불러와
// exposeInMainWorld('api', api)로 노출된 api 객체를 꺼낸다.
const loadExposedApi = async (): Promise<Api> => {
  vi.resetModules();
  await import('./index');

  const call = mockExposeInMainWorld.mock.calls.find(([key]) => key === 'api');

  if (!call) {
    throw new Error('api가 노출되지 않았습니다.');
  }

  const [, api] = call;

  return api;
};

describe('preload', () => {
  afterEach(() => {
    mockInvoke.mockReset();
    mockExposeInMainWorld.mockReset();
    Reflect.deleteProperty(process, 'contextIsolated');
  });

  it('contextIsolated가 켜져 있으면 electron과 api를 renderer에 노출한다', async () => {
    setContextIsolated(true);

    await loadExposedApi();

    expect(mockExposeInMainWorld).toHaveBeenCalledWith('electron', fakeElectronAPI);
    expect(mockExposeInMainWorld).toHaveBeenCalledWith('api', expect.any(Object));
  });

  it.each([
    ['createLoginPage', (api: Api) => api.createLoginPage()],
    ['getSaleProducts', (api: Api) => api.getSaleProducts()],
    ['getProductRows', (api: Api) => api.getProductRows()],
  ])(
    '%s를 호출하면 같은 이름의 채널로 ipcRenderer.invoke를 호출하고 결과를 반환한다',
    async (channel, callApi) => {
      setContextIsolated(true);
      mockInvoke.mockResolvedValue({ channel });

      const api = await loadExposedApi();
      const result = await callApi(api);

      expect(mockInvoke).toHaveBeenCalledWith(channel);
      expect(result).toEqual({ channel });
    },
  );

  it('contextBridge 노출 중 예외가 발생하면 콘솔에 로깅한다', async () => {
    setContextIsolated(true);

    const error = new Error('노출 실패');
    mockExposeInMainWorld.mockImplementation(() => {
      throw error;
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.resetModules();
    await import('./index');

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);

    consoleErrorSpy.mockRestore();
  });
});
