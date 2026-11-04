import { afterEach, expect, it, vi } from 'vitest';
import { registerIpcHandlers } from './registerIpcHandlers';

const mockHandle = vi.fn();
const mockCreateUpdateScheduler = vi.fn();
const mockCreateStartUpdate = vi.fn();
const mockCreateStopUpdate = vi.fn();
const mockStartUpdate = vi.fn();
const mockStopUpdate = vi.fn();
const mockEncryptSecret = vi.fn();

vi.mock('electron', () => ({
  ipcMain: { handle: (...args: unknown[]) => mockHandle(...args) },
}));

vi.mock(import('./updateScheduler'), () => ({
  default: (...args: unknown[]) => mockCreateUpdateScheduler(...args),
}));

vi.mock(import('./startUpdate'), () => ({
  default: (...args: unknown[]) => mockCreateStartUpdate(...args),
}));

vi.mock(import('./stopUpdate'), () => ({
  default: (...args: unknown[]) => mockCreateStopUpdate(...args),
}));

vi.mock(import('./encryptSecret'), () => ({
  default: (...args: unknown[]) => mockEncryptSecret(...args),
}));

afterEach(() => {
  mockHandle.mockReset();
  mockCreateUpdateScheduler.mockReset();
  mockCreateStartUpdate.mockReset();
  mockCreateStopUpdate.mockReset();
  mockStartUpdate.mockReset();
  mockStopUpdate.mockReset();
  mockEncryptSecret.mockReset();
});

// ipcMain.handle에 등록된 콜백 중 해당 채널의 콜백을 찾는다.
const findRegisteredCallback = (channel: string): ((...args: unknown[]) => unknown) => {
  const call = mockHandle.mock.calls.find(([registeredChannel]) => registeredChannel === channel);

  if (!call) {
    throw new Error(`${channel} 채널이 등록되지 않았습니다.`);
  }

  return call[1];
};

const fakeScheduler = {};

it('scheduler를 한 번만 만들어 startUpdate, stopUpdate 핸들러에 함께 넘긴다', () => {
  mockCreateUpdateScheduler.mockReturnValue(fakeScheduler);

  registerIpcHandlers();

  expect(mockCreateUpdateScheduler).toHaveBeenCalledOnce();
  expect(mockCreateStartUpdate).toHaveBeenCalledWith(fakeScheduler);
  expect(mockCreateStopUpdate).toHaveBeenCalledWith(fakeScheduler);
});

it('startUpdate 채널이 호출되면 재실행 간격과 요청한 창(sender)을 핸들러에 전달한다', async () => {
  const sender = { send: vi.fn() };
  mockCreateStartUpdate.mockReturnValue(mockStartUpdate);

  registerIpcHandlers();
  await findRegisteredCallback('startUpdate')({ sender }, 30);

  expect(mockStartUpdate).toHaveBeenCalledWith(30, sender);
});

it('stopUpdate 채널이 호출되면 stopUpdate 핸들러를 호출한다', async () => {
  mockCreateStopUpdate.mockReturnValue(mockStopUpdate);

  registerIpcHandlers();
  await findRegisteredCallback('stopUpdate')({ sender: {} });

  expect(mockStopUpdate).toHaveBeenCalledOnce();
});

it('encryptSecret 채널이 호출되면 비밀값을 핸들러에 전달하고 암호문을 응답한다', async () => {
  const sender = { send: vi.fn() };
  mockEncryptSecret.mockResolvedValue('encrypted');

  registerIpcHandlers();
  const response = await findRegisteredCallback('encryptSecret')({ sender }, 'secret');

  expect(mockEncryptSecret).toHaveBeenCalledWith('secret', sender);
  expect(response).toBe('encrypted');
});
