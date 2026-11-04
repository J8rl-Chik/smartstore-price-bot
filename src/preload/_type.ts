import { ElectronAPI } from '@electron-toolkit/preload';
import type { UpdateState } from '../domain/product/_type';

// main <-> renderer가 양방향(invoke/handle)으로 주고받는 IPC 채널을 함수 형태로 정의한다.
// 매개변수는 요청 인자, 반환값(Promise)은 응답 타입이다.
// 매개변수는 렌더러가 실제로 보내는 값만 담는다. IpcMainInvokeEvent는
// ipcMain.handle이 자동으로 넘겨주는 값이라 렌더러가 보내는 인자가 아니다.
export interface IpcInvoke {
  /**
   * 상품 목록 조회, 로그인, 가격 수정 순회를 시작한다. 진행 상태와 실패 이유는 onUpdateState 구독으로 받는다.
   * restartDelayMinutes가 있으면 순회가 끝날 때마다 그만큼 기다렸다가 다시 순회한다. null이면 한 번만 순회한다.
   * 순회 중이거나 재실행을 기다리는 중에는 새로 시작하지 않는다. 응답은 첫 순회가 끝나면 온다.
   */
  startUpdate: (restartDelayMinutes: number | null) => Promise<void>;
  // 예약한 자동 재실행을 취소한다. 순회 중에는 예약한 재실행이 없어 아무것도 하지 않는다.
  stopUpdate: () => Promise<void>;
  // 비밀값을 암호화해 base64 암호문으로 돌려준다. 평문 대신 이 암호문을 저장한다.
  encryptSecret: (secret: string) => Promise<string>;
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
