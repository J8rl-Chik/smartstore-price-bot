import { ElectronAPI } from '@electron-toolkit/preload';
import type {
  ProductRowsResponse,
  SaleProductsResponse,
  TargetProductsResponse,
} from '../domain/product/_type';

// main <-> renderer가 양방향(invoke/handle)으로 주고받는 IPC 채널과
// 각 채널의 요청 인자(args), 응답 타입(returnType)을 정의한다.
// args는 렌더러가 실제로 보내는 값만 담는다. IpcMainInvokeEvent는
// ipcMain.handle이 자동으로 넘겨주는 값이라 렌더러가 보내는 인자가 아니다.
export interface IpcEvent {
  createLoginPage: { args: []; returnType: void };
  getSaleProducts: { args: []; returnType: SaleProductsResponse };
  getProductRows: { args: []; returnType: ProductRowsResponse };
  getTargetProducts: { args: []; returnType: TargetProductsResponse };
}

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
