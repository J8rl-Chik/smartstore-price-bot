import { ipcMain, type WebContents } from 'electron';
import { IpcInvoke } from '../preload/_type';
import { START_UPDATE_CHANNEL } from '../preload/ipcChannel';
import createStartUpdate from './startUpdate';

/**
 * 채널 이름(K)에 맞는 요청 인자와 응답 타입을 강제하는 ipcMain.handle 래퍼.
 * 요청한 창(sender)은 렌더러가 보낸 인자 뒤에 붙여 전달한다. 쓰지 않는 핸들러는 받지 않아도 된다.
 */
const handleIpc = <E extends keyof IpcInvoke>(
  event: E,
  handler: (...args: [...Parameters<IpcInvoke[E]>, WebContents]) => ReturnType<IpcInvoke[E]>,
): void => {
  // ipcMain.handle 콜백의 첫 번째 인자(IpcMainInvokeEvent)는 렌더러가 보낸 값이 아니므로 sender만 꺼내 handler에 전달한다.
  ipcMain.handle(event, (ipcEvent, ...args) =>
    handler(...(args as Parameters<IpcInvoke[E]>), ipcEvent.sender),
  );
};

export const registerIpcHandlers = (): void => {
  handleIpc(START_UPDATE_CHANNEL, createStartUpdate());
};
