import type { WebContents } from 'electron';
import type { TargetProductUpdate, UpdateState } from '../domain/product/_type';
import { UPDATE_STATE_CHANNEL } from '../preload/ipcChannel';

let state: UpdateState = {
  targetProducts: [],
  invalidProductRows: [],
  currentIndex: null,
  isPreparing: false,
  isRunning: false,
};

/**
 * 바뀐 값만 state에 덮어쓰고, 덮어쓴 상태 전체를 요청한 창의 updateState 채널로 보낸다.
 * renderer는 상태를 받은 그대로 저장하므로 바뀐 값만이 아니라 상태 전체를 보낸다.
 */
export const sendState = (sender: WebContents, nextState: Partial<UpdateState>): void => {
  state = { ...state, ...nextState };

  sender.send(UPDATE_STATE_CHANNEL, state);
};

/**
 * index 위치의 상품만 수정 결과를 바꾼 새 목록으로 상태를 보낸다.
 * 항상 마지막으로 보낸 목록을 기준으로 바꾸므로, 앞에서 반영한 다른 상품의 결과가 유지된다.
 */
export const sendUpdate = (sender: WebContents, index: number, update: TargetProductUpdate): void =>
  sendState(sender, {
    targetProducts: state.targetProducts.map((target, targetIndex) =>
      targetIndex === index ? { ...target, update } : target,
    ),
  });
