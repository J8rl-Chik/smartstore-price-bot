import { ElectronAPI } from '@electron-toolkit/preload';
import type { Delivery } from '../domain/delivery/_type';
import type { TargetProductsResponse } from '../domain/product/_type';
import type { Seller } from '../domain/seller/filterExcludedSellers';

export type SellersResponse =
  { isSuccess: true; sellers: Seller[] } | { isSuccess: false; error: string };

export type TargetPriceResponse =
  { isSuccess: true; targetPrice: number } | { isSuccess: false; error: string };

export type UpdatePriceResponse =
  { isSuccess: true; salePrice: number; baseFee: number } | { isSuccess: false; error: string };

// main <-> renderer가 양방향(invoke/handle)으로 주고받는 IPC 채널을 함수 형태로 정의한다.
// 매개변수는 요청 인자, 반환값(Promise)은 응답 타입이다.
// 매개변수는 렌더러가 실제로 보내는 값만 담는다. IpcMainInvokeEvent는
// ipcMain.handle이 자동으로 넘겨주는 값이라 렌더러가 보내는 인자가 아니다.
export interface IpcEvent {
  createLoginPage: () => Promise<void>;
  getTargetProducts: () => Promise<TargetProductsResponse>;
  // TODO: getSellers부터 인자 타입 일부를 TargetProduct 타입에서 import해 TargetProduct['sheet']['catalogURL'] 같은 프로퍼티 접근 방식으로 대체하는 것을 고려한다.
  getSellers: (catalogURL: string, productName: string) => Promise<SellersResponse>;
  filterSellers: (sellers: Seller[], excludedSellerNames: string[]) => Promise<SellersResponse>;
  getTargetPrice: (prices: number[], freeDeliveryPrice: number) => Promise<TargetPriceResponse>;
  updatePrice: (
    originProductNo: number,
    targetPrice: number,
    delivery: Delivery,
  ) => Promise<UpdatePriceResponse>;
}

// 선언 병합으로 전역 Window 인터페이스에 electron, api 프로퍼티를 추가한다.
// api는 IpcEvent와 같은 모양이다. preload가 각 채널을 같은 이름의 함수로 노출한다.
declare global {
  interface Window {
    electron: ElectronAPI;
    api: IpcEvent;
  }
}
