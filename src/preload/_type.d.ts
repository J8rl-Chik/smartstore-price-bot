import { ElectronAPI } from '@electron-toolkit/preload';
import type { TargetProduct, TargetProductsResponse, UpdateState } from '../domain/product/_type';

// main <-> renderer가 양방향(invoke/handle)으로 주고받는 IPC 채널을 함수 형태로 정의한다.
// 매개변수는 요청 인자, 반환값(Promise)은 응답 타입이다.
// 매개변수는 렌더러가 실제로 보내는 값만 담는다. IpcMainInvokeEvent는
// ipcMain.handle이 자동으로 넘겨주는 값이라 렌더러가 보내는 인자가 아니다.
export interface IpcEvent {
  createLoginPage: () => Promise<void>;
  getTargetProducts: () => Promise<TargetProductsResponse>;
  // 상품 목록 전체의 가격 수정 순회를 시작한다. 진행 상태는 응답이 아니라 onUpdateState 구독으로 전달된다.
  startUpdate: (targetProducts: TargetProduct[]) => Promise<void>;
}

// 선언 병합으로 전역 Window 인터페이스에 electron, api 프로퍼티를 추가한다.
// api의 IpcEvent 부분은 invoke/handle 채널을 같은 이름의 함수로 노출한다.
declare global {
  interface Window {
    electron: ElectronAPI;
    api: IpcEvent & {
      // main이 순회 상태가 바뀔 때마다 push하는 updateState 채널을 구독한다.
      // callback을 등록 해제하는 함수를 반환한다.
      onUpdateState: (callback: (state: UpdateState) => void) => () => void;
    };
  }
}
