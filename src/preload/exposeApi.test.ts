import { afterEach, describe, expect, it, vi } from 'vitest';
import { exposeApi } from './exposeApi';
import type { UpdateState } from '../domain/product/_type';
import type { IpcEvent, IpcListener } from './_type';

// preload가 renderer에 노출하는 api의 형태. IpcEvent와 IpcListener를 합친 모양이다.
type Api = IpcEvent & IpcListener;

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
  });

  it('electron과 api를 renderer에 노출한다', () => {
    exposeApi();

    expect(mockExposeInMainWorld).toHaveBeenCalledWith('electron', fakeElectronAPI);
    expect(mockExposeInMainWorld).toHaveBeenCalledWith('api', expect.any(Object));
  });

  it('startUpdate를 호출하면 startUpdate 채널로 invoke를 호출한다', async () => {
    mockInvoke.mockResolvedValue(undefined);

    const api = getExposedApi();
    await api.startUpdate();

    expect(mockInvoke).toHaveBeenCalledWith('startUpdate');
  });

  it('onUpdateState를 호출하면 updateState 채널에 listener를 등록한다', () => {
    const api = getExposedApi();
    api.onUpdateState(vi.fn());

    expect(mockOn).toHaveBeenCalledWith('updateState', expect.any(Function));
  });

  it('updateState 채널로 상태가 오면 onUpdateState에 넘긴 callback에 상태만 전달한다', () => {
    const state: UpdateState = { targetProducts: [], currentIndex: null, isRunning: true };
    const callback = vi.fn();
    const api = getExposedApi();
    api.onUpdateState(callback);

    const [, listener] = mockOn.mock.calls[0];
    listener({ name: 'fake-ipc-event' }, state);

    expect(callback).toHaveBeenCalledWith(state);
  });

  it('onUpdateState가 반환한 함수를 호출하면 등록한 listener를 updateState 채널에서 해제한다', () => {
    const api = getExposedApi();
    const unsubscribe = api.onUpdateState(vi.fn());
    unsubscribe();

    const [, listener] = mockOn.mock.calls[0];

    expect(mockRemoveListener).toHaveBeenCalledWith('updateState', listener);
  });

  it('contextBridge 노출 중 예외가 발생하면 콘솔에 로깅한다', () => {
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
