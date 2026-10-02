import { ElectronAPI } from '@electron-toolkit/preload';
import { IpcEvent } from './ipcEvent';

// 선언 병합으로 전역 Window 인터페이스에 electron, api 프로퍼티를 추가한다.
declare global {
  interface Window {
    electron: ElectronAPI;
    api: {
      createLoginPage: () => Promise<IpcEvent['createLoginPage']['returnType']>;
      getSaleProducts: () => Promise<IpcEvent['getSaleProducts']['returnType']>;
      getProductRows: () => Promise<IpcEvent['getProductRows']['returnType']>;
      getTargetProducts: () => Promise<IpcEvent['getTargetProducts']['returnType']>;
    };
  }
}
// const d = 2;
