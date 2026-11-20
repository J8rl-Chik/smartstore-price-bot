import { afterEach, expect, it, vi } from 'vitest';
import { registerIpcHandlers } from './registerIpcHandlers';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';

const mockHandle = vi.fn();
const mockCreateUpdateScheduler = vi.fn();
const mockCreateStartUpdate = vi.fn();
const mockCreateStopUpdate = vi.fn();
const mockStartUpdate = vi.fn();
const mockStopUpdate = vi.fn();
const mockEncryptSecret = vi.fn();
const mockIsOpenAtLoginEnabled = vi.fn();
const mockSetOpenAtLogin = vi.fn();
const mockIsOpenedAtLogin = vi.fn();

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

vi.mock(import('./openAtLogin'), () => ({
  isOpenAtLoginEnabled: () => mockIsOpenAtLoginEnabled(),
  setOpenAtLogin: (isEnabled: boolean) => mockSetOpenAtLogin(isEnabled),
  isOpenedAtLogin: () => mockIsOpenedAtLogin(),
}));

const rendererOrigin = 'app://renderer';

vi.mock(import('./rendererURL'), () => ({
  getRendererOrigin: () => rendererOrigin,
}));

afterEach(() => {
  mockHandle.mockReset();
  mockCreateUpdateScheduler.mockReset();
  mockCreateStartUpdate.mockReset();
  mockCreateStopUpdate.mockReset();
  mockStartUpdate.mockReset();
  mockStopUpdate.mockReset();
  mockEncryptSecret.mockReset();
  mockIsOpenAtLoginEnabled.mockReset();
  mockSetOpenAtLogin.mockReset();
  mockIsOpenedAtLogin.mockReset();
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

// 요청을 보낸 프레임. 앱 창이 띄운 renderer 페이지다.
const senderFrame = { origin: rendererOrigin, url: `${rendererOrigin}/index.html` };

it('startUpdate 채널이 호출되면 설정과 요청한 창(sender)을 핸들러에 전달한다', async () => {
  const sender = { send: vi.fn() };
  const settings = { naverId: 'naver-id' };
  mockCreateStartUpdate.mockReturnValue(mockStartUpdate);

  registerIpcHandlers();
  await findRegisteredCallback('startUpdate')({ sender, senderFrame }, settings);

  expect(mockStartUpdate).toHaveBeenCalledWith(settings, sender);
});

it('stopUpdate 채널이 호출되면 stopUpdate 핸들러를 호출한다', async () => {
  mockCreateStopUpdate.mockReturnValue(mockStopUpdate);

  registerIpcHandlers();
  await findRegisteredCallback('stopUpdate')({ sender: {}, senderFrame });

  expect(mockStopUpdate).toHaveBeenCalledOnce();
});

it('encryptSecret 채널이 호출되면 비밀값을 핸들러에 전달하고 암호문을 응답한다', async () => {
  const sender = { send: vi.fn() };
  mockEncryptSecret.mockResolvedValue('encrypted');

  registerIpcHandlers();
  const response = await findRegisteredCallback('encryptSecret')({ sender, senderFrame }, 'secret');

  expect(mockEncryptSecret).toHaveBeenCalledWith('secret', sender);
  expect(response).toBe('encrypted');
});

it('isOpenAtLoginEnabled 채널이 호출되면 시작 프로그램 등록 여부를 응답한다', async () => {
  mockIsOpenAtLoginEnabled.mockReturnValue(true);

  registerIpcHandlers();
  const response = await findRegisteredCallback('isOpenAtLoginEnabled')({
    sender: {},
    senderFrame,
  });

  expect(response).toBe(true);
});

it('setOpenAtLogin 채널이 호출되면 켤지 여부를 핸들러에 전달한다', async () => {
  registerIpcHandlers();
  await findRegisteredCallback('setOpenAtLogin')({ sender: {}, senderFrame }, true);

  expect(mockSetOpenAtLogin).toHaveBeenCalledWith(true);
});

it('isOpenedAtLogin 채널이 호출되면 시작 프로그램으로 켜졌는지를 응답한다', async () => {
  mockIsOpenedAtLogin.mockReturnValue(true);

  registerIpcHandlers();
  const response = await findRegisteredCallback('isOpenedAtLogin')({ sender: {}, senderFrame });

  expect(response).toBe(true);
});

it('주소(url)와 관계없이 renderer와 같은 origin에서 보낸 요청은 처리한다', async () => {
  mockCreateStopUpdate.mockReturnValue(mockStopUpdate);

  registerIpcHandlers();
  // about:blank로 연 자식 창은 url이 빈 문자열이고 origin은 부모 프레임의 origin이다.
  await findRegisteredCallback('stopUpdate')({
    sender: {},
    senderFrame: { origin: rendererOrigin, url: '' },
  });

  expect(mockStopUpdate).toHaveBeenCalledOnce();
});

it('외부 페이지에서 보낸 요청은 핸들러를 호출하지 않고 에러를 던진다', async () => {
  registerIpcHandlers();

  await expect(
    findRegisteredCallback('encryptSecret')(
      { sender: {}, senderFrame: { origin: 'https://example.com', url: 'https://example.com/' } },
      'secret',
    ),
  ).rejects.toThrow(ERROR_MESSAGE.IPC_SENDER_NOT_ALLOWED);
  expect(mockEncryptSecret).not.toHaveBeenCalled();
});

it('로컬 파일(file://)에서 보낸 요청은 처리하지 않는다', async () => {
  registerIpcHandlers();

  await expect(
    findRegisteredCallback('setOpenAtLogin')(
      {
        sender: {},
        senderFrame: { origin: 'file://', url: 'file:///C:/Users/user/Downloads/page.html' },
      },
      true,
    ),
  ).rejects.toThrow(ERROR_MESSAGE.IPC_SENDER_NOT_ALLOWED);
  expect(mockSetOpenAtLogin).not.toHaveBeenCalled();
});

it('요청을 보낸 프레임이 이미 사라졌으면(null) 처리하지 않는다', async () => {
  registerIpcHandlers();

  await expect(
    findRegisteredCallback('isOpenedAtLogin')({ sender: {}, senderFrame: null }),
  ).rejects.toThrow(ERROR_MESSAGE.IPC_SENDER_NOT_ALLOWED);
  expect(mockIsOpenedAtLogin).not.toHaveBeenCalled();
});

it('origin이 없는 프레임(sandbox, data: 등 "null" origin)에서 보낸 요청은 처리하지 않는다', async () => {
  registerIpcHandlers();

  await expect(
    findRegisteredCallback('isOpenAtLoginEnabled')({
      sender: {},
      senderFrame: { origin: 'null', url: 'about:srcdoc' },
    }),
  ).rejects.toThrow(ERROR_MESSAGE.IPC_SENDER_NOT_ALLOWED);
  expect(mockIsOpenAtLoginEnabled).not.toHaveBeenCalled();
});
