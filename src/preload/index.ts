// preload 스크립트: main 프로세스와 renderer 프로세스 사이에서 실행되며,
// renderer(웹 페이지)가 안전하게 접근할 수 있는 API를 window 객체에 노출하는 역할을 한다.
import { contextBridge } from 'electron';
// electron-toolkit이 제공하는 공통 헬퍼(ipcRenderer 래퍼 등)
import { electronAPI } from '@electron-toolkit/preload';

// 이 프로젝트에서 renderer에 직접 노출할 커스텀 API. 아직은 비어있음.
const api = {};

/**
 * contextIsolation이 켜져 있으면(Electron 기본값, 보안 권장 설정)
 * renderer가 Node.js/Electron 객체에 직접 접근할 수 없으므로,
 * contextBridge를 통해서만 안전하게 API를 주입할 수 있다.
 * 꺼져 있는 경우(레거시 설정)에는 window 전역에 바로 할당해도 된다.
 */
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
