import { ElectronAPI } from '@electron-toolkit/preload';
import type {
  ProductRowsResponse,
  SaleProductsResponse,
  TargetProductsResponse,
} from '../domain/product/_type';

// main <-> renderer가 양방향(invoke/handle)으로 주고받는 IPC 채널을 함수 형태로 정의한다.
// 매개변수는 요청 인자, 반환값(Promise)은 응답 타입이다.
// 매개변수는 렌더러가 실제로 보내는 값만 담는다. IpcMainInvokeEvent는
// ipcMain.handle이 자동으로 넘겨주는 값이라 렌더러가 보내는 인자가 아니다.
export interface IpcEvent {
  createLoginPage: () => Promise<void>;
  getSaleProducts: () => Promise<SaleProductsResponse>;
  getProductRows: () => Promise<ProductRowsResponse>;
  getTargetProducts: () => Promise<TargetProductsResponse>;
}

// 선언 병합으로 전역 Window 인터페이스에 electron, api 프로퍼티를 추가한다.
// api는 IpcEvent와 같은 모양이다. preload가 각 채널을 같은 이름의 함수로 노출한다.
declare global {
  interface Window {
    electron: ElectronAPI;
    api: IpcEvent;
  }
}
