import { afterEach, expect, it, vi } from 'vitest';
import { registerIpcHandlers } from './registerIpcHandlers';

const mockHandle = vi.fn();
const mockCreateStartUpdate = vi.fn();
const mockStartUpdate = vi.fn();

vi.mock('electron', () => ({
  ipcMain: { handle: (...args: unknown[]) => mockHandle(...args) },
}));

vi.mock(import('./startUpdate'), () => ({
  default: (...args: unknown[]) => mockCreateStartUpdate(...args),
}));

afterEach(() => {
  mockHandle.mockReset();
  mockCreateStartUpdate.mockReset();
  mockStartUpdate.mockReset();
});

// ipcMain.handle에 등록된 콜백 중 해당 채널의 콜백을 찾는다.
const findRegisteredCallback = (channel: string): ((...args: unknown[]) => unknown) => {
  const call = mockHandle.mock.calls.find(([registeredChannel]) => registeredChannel === channel);

  if (!call) {
    throw new Error(`${channel} 채널이 등록되지 않았습니다.`);
  }

  return call[1];
};

it('startUpdate 채널에 createStartUpdate로 만든 핸들러를 한 번만 만들어 등록한다', () => {
  mockCreateStartUpdate.mockReturnValue(mockStartUpdate);

  registerIpcHandlers();

  expect(mockCreateStartUpdate).toHaveBeenCalledTimes(1);
  expect(mockHandle).toHaveBeenCalledWith('startUpdate', expect.any(Function));
});

it('startUpdate 채널이 호출되면 요청한 창(sender)을 핸들러에 전달한다', async () => {
  const sender = { send: vi.fn() };
  mockCreateStartUpdate.mockReturnValue(mockStartUpdate);

  registerIpcHandlers();
  await findRegisteredCallback('startUpdate')({ sender });

  expect(mockStartUpdate).toHaveBeenCalledWith(sender);
});

it('startUpdate 핸들러가 돌려준 결과를 응답으로 돌려준다', async () => {
  mockStartUpdate.mockResolvedValue({ status: 'error', message: '네이버 로그인에 실패했습니다.' });
  mockCreateStartUpdate.mockReturnValue(mockStartUpdate);

  registerIpcHandlers();

  await expect(findRegisteredCallback('startUpdate')({ sender: {} })).resolves.toEqual({
    status: 'error',
    message: '네이버 로그인에 실패했습니다.',
  });
});
