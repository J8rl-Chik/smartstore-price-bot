// renderer(웹 페이지)가 안전하게 접근할 수 있는 API를 window 객체에 노출한다.
import { contextBridge, ipcRenderer } from 'electron';
// electron-toolkit이 제공하는 공통 헬퍼(ipcRenderer 래퍼 등)
import { electronAPI } from '@electron-toolkit/preload';
import type { UpdateState } from '../domain/product/_type';
import type { IpcEvent, IpcListener } from './_type';

// main이 순회 상태를 보내는 채널 이름. main/registerIpcHandlers.ts의 채널 이름과 같아야 한다.
const UPDATE_STATE_CHANNEL = 'updateState';

// 이 프로젝트에서 renderer에 직접 노출할 커스텀 API.
const api: IpcEvent & IpcListener = {
  // renderer -> main으로 'startUpdate' 요청을 보내 상품 목록 조회, 로그인, 가격 수정 순회를 시작한다.
  startUpdate: () => ipcRenderer.invoke('startUpdate'),
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
 * contextIsolation이 켜져 있으면(Electron 기본값, 보안 권장 설정)
 * renderer가 Node.js/Electron 객체에 직접 접근할 수 없으므로,
 * contextBridge를 통해서만 안전하게 API를 주입할 수 있다.
 * 꺼져 있는 경우(레거시 설정)에는 window 전역에 바로 할당해도 된다.
 */
export const exposeApi = (): void => {
  if (process.contextIsolated) {
    try {
      // renderer에서 window.electron 으로 electron-toolkit 헬퍼 사용 가능
      contextBridge.exposeInMainWorld('electron', electronAPI);
      // renderer에서 window.api 로 커스텀 API 사용 가능
      contextBridge.exposeInMainWorld('api', api);
    } catch (error) {
      console.error(error);
    }
  } else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI;
    // @ts-ignore (define in dts)
    window.api = api;
  }
};
