// renderer(웹 페이지)가 안전하게 접근할 수 있는 API를 window 객체에 노출한다.
import { contextBridge, ipcRenderer } from 'electron';
// electron-toolkit이 제공하는 공통 헬퍼(ipcRenderer 래퍼 등)
import { electronAPI } from '@electron-toolkit/preload';
import type { UpdateState } from '../domain/product/_type';
import type { IpcEvent, IpcListener } from './_type';

// main이 순회 상태를 보내는 채널 이름. main/registerIpcHandlers.ts의 채널 이름과 같아야 한다.
const updateStateChannel = 'updateState';

// 이 프로젝트에서 renderer에 직접 노출할 커스텀 API.
const api: IpcEvent & IpcListener = {
  // renderer -> main으로 'startUpdate' 요청을 보내 상품 목록 조회, 로그인, 가격 수정 순회를 시작한다.
  startUpdate: () => ipcRenderer.invoke('startUpdate'),
  // main -> renderer로 오는 'updateState' 채널을 구독한다. 반환한 함수를 호출하면 구독을 해제한다.
  onUpdateState: (callback) => {
    const listener = (_event: unknown, state: UpdateState): void => callback(state);

    ipcRenderer.on(updateStateChannel, listener);

    return () => {
      ipcRenderer.removeListener(updateStateChannel, listener);
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
    // renderer에서 window.electron 으로 electron-toolkit 헬퍼 사용 가능
    contextBridge.exposeInMainWorld('electron', electronAPI);
    // renderer에서 window.api 로 커스텀 API 사용 가능
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
};
