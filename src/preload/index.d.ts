import { ElectronAPI } from '@electron-toolkit/preload';

// 선언 병합으로 전역 Window 인터페이스에 electron, api 프로퍼티를 추가한다.
declare global {
  interface Window {
    electron: ElectronAPI;
    api: unknown;
  }
}
