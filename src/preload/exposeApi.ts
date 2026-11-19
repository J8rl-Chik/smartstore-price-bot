/**
 * renderer(웹 페이지)가 안전하게 접근할 수 있는 API를 window 객체에 노출한다.
 * 진입점(index.ts)과 분리해 exposeApi를 함수로만 export한다.
 * 진입점처럼 import하자마자 실행되면 테스트에서 electron mock을 준비하기 전에 실행되고, 호출 시점도 정할 수 없기 때문이다.
 * 이 파일을 import해도 아무것도 실행되지 않으므로, 테스트는 mock을 준비한 뒤 원하는 시점에 exposeApi()를 호출한다.
 */
import { contextBridge, ipcRenderer } from 'electron';
import type { UpdateState } from '../domain/product/_type';
import type { IpcInvoke, IpcListener } from './_type';
import {
  ENCRYPT_SECRET_CHANNEL,
  IS_OPEN_AT_LOGIN_ENABLED_CHANNEL,
  IS_OPENED_AT_LOGIN_CHANNEL,
  SET_OPEN_AT_LOGIN_CHANNEL,
  START_UPDATE_CHANNEL,
  STOP_UPDATE_CHANNEL,
  UPDATE_STATE_CHANNEL,
} from './ipcChannel';

// 이 프로젝트에서 renderer에 직접 노출할 커스텀 API.
const api: IpcInvoke & IpcListener = {
  // renderer -> main으로 'startUpdate' 요청을 보내 상품 목록 조회, 로그인, 가격 수정 순회를 시작한다.
  startUpdate: (settings) => ipcRenderer.invoke(START_UPDATE_CHANNEL, settings),
  // renderer -> main으로 'stopUpdate' 요청을 보내 예약한 자동 재실행을 취소한다.
  stopUpdate: () => ipcRenderer.invoke(STOP_UPDATE_CHANNEL),
  // renderer -> main으로 'encryptSecret' 요청을 보내 비밀값을 암호화한다.
  encryptSecret: (secret) => ipcRenderer.invoke(ENCRYPT_SECRET_CHANNEL, secret),
  // renderer -> main으로 'isOpenAtLoginEnabled' 요청을 보내 시작 프로그램 등록 여부를 받는다.
  isOpenAtLoginEnabled: () => ipcRenderer.invoke(IS_OPEN_AT_LOGIN_ENABLED_CHANNEL),
  // renderer -> main으로 'setOpenAtLogin' 요청을 보내 시작 프로그램에 등록하거나 해제한다.
  setOpenAtLogin: (isEnabled) => ipcRenderer.invoke(SET_OPEN_AT_LOGIN_CHANNEL, isEnabled),
  // renderer -> main으로 'isOpenedAtLogin' 요청을 보내 이번 실행이 시작 프로그램으로 켜졌는지 받는다.
  isOpenedAtLogin: () => ipcRenderer.invoke(IS_OPENED_AT_LOGIN_CHANNEL),
  // main -> renderer로 오는 'updateState' 채널을 구독한다. 반환한 함수를 호출하면 구독을 해제한다.
  onUpdateState: (callback) => {
    const listener = (_event: unknown, state: UpdateState): void => callback(state);

    ipcRenderer.on(UPDATE_STATE_CHANNEL, listener);

    return () => {
      ipcRenderer.removeListener(UPDATE_STATE_CHANNEL, listener);
    };
  },
};

/**
 * contextIsolation(Electron 기본값, 보안 권장 설정)이 켜져 있으면 renderer가 Node.js/Electron 객체에
 * 직접 접근할 수 없으므로, contextBridge를 통해서만 API를 주입한다.
 * 이 프로젝트는 contextIsolation을 끄지 않으므로 window 전역에 직접 할당하는 분기는 두지 않는다.
 * 꺼져 있으면 exposeInMainWorld가 예외를 던지고 콘솔에 로깅된다.
 */
export const exposeApi = (): void => {
  try {
    /**
     * renderer에서 window.api 로 커스텀 API 사용 가능
     * ipcRenderer를 그대로 노출하면 renderer가 아무 채널이나 호출할 수 있어, 정해 둔 채널의 함수만 노출한다.
     */
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
};
