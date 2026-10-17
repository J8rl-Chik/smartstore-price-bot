import { afterEach, describe, expect, it, vi } from 'vitest';
import { exposeApi } from './exposeApi';
import type { TargetProduct, UpdateState } from '../domain/product/_type';
import type { IpcEvent } from './_type';

// preload가 renderer에 노출하는 api의 형태. IpcEvent에 onUpdateState 구독 함수가 더해진 모양이다.
type Api = IpcEvent & { onUpdateState: (callback: (state: UpdateState) => void) => () => void };

const mockInvoke = vi.fn();
const mockOn = vi.fn();
const mockRemoveListener = vi.fn();
const mockExposeInMainWorld = vi.fn();
// vi.mock 팩토리는 import보다 먼저 호이스팅되므로, 팩토리가 참조하는 값도 vi.hoisted로 먼저 만든다.
const { fakeElectronAPI } = vi.hoisted(() => ({
  fakeElectronAPI: { name: 'fake-electron-api' },
}));

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: (...args: unknown[]) => mockExposeInMainWorld(...args),
  },
  ipcRenderer: {
    invoke: (...args: unknown[]) => mockInvoke(...args),
    on: (...args: unknown[]) => mockOn(...args),
    removeListener: (...args: unknown[]) => mockRemoveListener(...args),
  },
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
    mockOn.mockReset();
    mockRemoveListener.mockReset();
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

  it('getTargetProducts를 호출하면 getTargetProducts 채널로 invoke를 호출하고 결과를 반환한다', async () => {
    setContextIsolated(true);
    mockInvoke.mockResolvedValue('getTargetProducts 결과');

    const api = getExposedApi();
    const result = await api.getTargetProducts();

    expect(mockInvoke).toHaveBeenCalledWith('getTargetProducts');
    expect(result).toBe('getTargetProducts 결과');
  });

  it('startUpdate를 호출하면 startUpdate 채널로 상품 목록과 함께 invoke를 호출하고 결과를 반환한다', async () => {
    setContextIsolated(true);
    mockInvoke.mockResolvedValue('startUpdate 결과');

    const targetProducts = [{ name: '상품A', originProductNo: 1 }] as unknown as TargetProduct[];
    const api = getExposedApi();
    const result = await api.startUpdate(targetProducts);

    expect(mockInvoke).toHaveBeenCalledWith('startUpdate', targetProducts);
    expect(result).toBe('startUpdate 결과');
  });

  it('onUpdateState를 호출하면 updateState 채널을 구독하고, 받은 상태로 콜백을 호출한다', () => {
    setContextIsolated(true);

    const api = getExposedApi();
    const callback = vi.fn();

    api.onUpdateState(callback);

    expect(mockOn).toHaveBeenCalledWith('updateState', expect.any(Function));

    const [, listener] = mockOn.mock.calls[0] as [
      string,
      (event: unknown, state: UpdateState) => void,
    ];
    const state: UpdateState = { targetProducts: [], currentIndex: null, isRunning: true };

    listener({}, state);

    expect(callback).toHaveBeenCalledWith(state);
  });

  it('onUpdateState가 반환한 함수를 호출하면 updateState 채널 구독을 해제한다', () => {
    setContextIsolated(true);

    const api = getExposedApi();
    const unsubscribe = api.onUpdateState(vi.fn());
    const [, listener] = mockOn.mock.calls[0] as [string, (...args: unknown[]) => void];

    unsubscribe();

    expect(mockRemoveListener).toHaveBeenCalledWith('updateState', listener);
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
