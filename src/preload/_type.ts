import { ElectronAPI } from '@electron-toolkit/preload';
import type { UpdateState } from '../domain/product/_type';

/**
 * startUpdate 요청에 대한 응답. 순회 진행 상태가 아니라 요청을 처리한 결과만 담는다.
 * done: 순회를 끝냈거나 수정할 상품이 없어 끝났다. 상품별 실패는 진행 상태의 update로 받는다.
 * running: 이미 순회가 도는 중이라 새로 시작하지 않았다.
 * error: 목록 조회·로그인처럼 순회를 시작하기 전에 실패했다. message는 가장 바깥 에러의 메시지다.
 */
export type StartUpdateResult =
  { status: 'done' } | { status: 'running' } | { status: 'error'; message: string };

// main <-> renderer가 양방향(invoke/handle)으로 주고받는 IPC 채널을 함수 형태로 정의한다.
// 매개변수는 요청 인자, 반환값(Promise)은 응답 타입이다.
// 매개변수는 렌더러가 실제로 보내는 값만 담는다. IpcMainInvokeEvent는
// ipcMain.handle이 자동으로 넘겨주는 값이라 렌더러가 보내는 인자가 아니다.
export interface IpcInvoke {
  /**
   * 상품 목록 조회, 로그인, 가격 수정 순회를 시작한다. 진행 상태는 응답이 아니라 onUpdateState 구독으로 받는다.
   * 응답은 순회가 끝난 뒤 처리 결과(StartUpdateResult)로 받는다.
   */
  startUpdate: () => Promise<StartUpdateResult>;
}

/**
 * main이 renderer로 보내는(send/on) 채널을 구독하는 함수를 정의한다.
 * callback을 등록하고, 호출하면 구독을 해제하는 함수를 반환한다.
 */
export interface IpcListener {
  onUpdateState: (callback: (state: UpdateState) => void) => () => void;
}

// 선언 병합으로 전역 Window 인터페이스에 electron, api 프로퍼티를 추가한다.
// api는 IpcInvoke와 IpcListener를 합친 모양이다. preload가 각 채널을 같은 이름의 함수로 노출한다.
declare global {
  interface Window {
    electron: ElectronAPI;
    api: IpcInvoke & IpcListener;
  }
}
