import { ipcMain, type WebContents, type WebFrameMain } from 'electron';
import { IpcInvoke } from '../preload/_type';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';
import { getRendererURL } from './rendererURL';
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

// 같은 페이지 안의 이동(#해시)이나 쿼리는 다른 페이지가 아니므로 비교에서 뺀다.
const removeHashAndSearch = (url: string): string => {
  const parsedURL = new URL(url);

  parsedURL.hash = '';
  parsedURL.search = '';

  return parsedURL.href;
};

/**
 * 요청을 보낸 프레임이 앱 창이 띄운 renderer 페이지인지 확인한다.
 * 프레임이 이미 사라졌거나(null), 주소를 해석할 수 없거나, 다른 페이지면 신뢰하지 않는다.
 */
const isTrustedSender = (senderFrame: WebFrameMain | null): boolean =>
  senderFrame !== null &&
  URL.canParse(senderFrame.url) &&
  removeHashAndSearch(senderFrame.url) === removeHashAndSearch(getRendererURL());

/**
 * 채널 이름(K)에 맞는 요청 인자와 응답 타입을 강제하는 ipcMain.handle 래퍼.
 * 요청한 창(sender)은 렌더러가 보낸 인자 뒤에 붙여 전달한다. 쓰지 않는 핸들러는 받지 않아도 된다.
 * 앱 창이 다른 페이지로 바뀌어도 그 페이지가 main 기능을 쓰지 못하도록, renderer 페이지가 보낸 요청만 처리한다.
 */
const handleIpc = <E extends keyof IpcInvoke>(
  event: E,
  handler: (...args: [...Parameters<IpcInvoke[E]>, WebContents]) => ReturnType<IpcInvoke[E]>,
): void => {
  // ipcMain.handle 콜백의 첫 번째 인자(IpcMainInvokeEvent)는 렌더러가 보낸 값이 아니므로 sender만 꺼내 handler에 전달한다.
  ipcMain.handle(event, async (ipcEvent, ...args) => {
    if (!isTrustedSender(ipcEvent.senderFrame)) {
      throw new Error(ERROR_MESSAGE.IPC_SENDER_NOT_ALLOWED);
    }

    return handler(...(args as Parameters<IpcInvoke[E]>), ipcEvent.sender);
  });
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
