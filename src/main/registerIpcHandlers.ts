import { ipcMain, type WebContents } from 'electron';
import { IpcInvoke } from '../preload/_type';
import {
  ENCRYPT_SECRET_CHANNEL,
  IS_OPEN_AT_LOGIN_ENABLED_CHANNEL,
  IS_OPENED_AT_LOGIN_CHANNEL,
  SET_OPEN_AT_LOGIN_CHANNEL,
  START_UPDATE_CHANNEL,
  STOP_UPDATE_CHANNEL,
} from '../preload/ipcChannel';
import encryptSecret from './encryptSecret';
import { isOpenAtLoginEnabled, isOpenedAtLogin, setOpenAtLogin } from './openAtLogin';
import createUpdateScheduler from './updateScheduler';
import createStartUpdate from './startUpdate';
import createStopUpdate from './stopUpdate';

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
  // stopUpdate가 startUpdate의 예약을 취소할 수 있도록 scheduler를 한 번만 만들어 함께 넘긴다.
  const scheduler = createUpdateScheduler();

  handleIpc(START_UPDATE_CHANNEL, createStartUpdate(scheduler));
  handleIpc(STOP_UPDATE_CHANNEL, createStopUpdate(scheduler));
  handleIpc(ENCRYPT_SECRET_CHANNEL, encryptSecret);

  // openAtLogin의 함수는 동기 함수라, 채널 응답 타입(Promise)에 맞게 async로 감싼다.
  handleIpc(IS_OPEN_AT_LOGIN_ENABLED_CHANNEL, async () => isOpenAtLoginEnabled());
  handleIpc(SET_OPEN_AT_LOGIN_CHANNEL, async (isEnabled) => setOpenAtLogin(isEnabled));
  handleIpc(IS_OPENED_AT_LOGIN_CHANNEL, async () => isOpenedAtLogin());
};
