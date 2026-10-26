import type { WebContents } from 'electron';
import type { TargetProductUpdate, UpdateState } from '../domain/product/_type';
import { UPDATE_STATE_CHANNEL } from '../preload/ipcChannel';

interface StateSender {
  sendState: (nextState: Partial<UpdateState>) => void;
  sendUpdate: (index: number, update: TargetProductUpdate) => void;
}

const initialState: UpdateState = {
  targetProducts: [],
  invalidProductRows: [],
  currentIndex: null,
  isPreparing: false,
  isRunning: false,
};

/**
 * 요청한 창(sender)으로 상태를 보내는 함수들을 만든다.
 * 순회를 시작할 때마다 새로 만들어, 상태는 빈 초기 상태에서 시작하고 그 순회를 시작한 창에만 보낸다.
 * 이전 순회의 결과는 여기서 이어받지 않는다.
 */
export const createStateSender = (sender: WebContents): StateSender => {
  let state = initialState;

  /**
   * 바뀐 값만 state에 덮어쓰고, 덮어쓴 상태 전체를 updateState 채널로 보낸다.
   * renderer는 상태를 받은 그대로 저장하므로 바뀐 값만이 아니라 상태 전체를 보낸다.
   */
  const sendState = (nextState: Partial<UpdateState>): void => {
    state = { ...state, ...nextState };

    sender.send(UPDATE_STATE_CHANNEL, state);
  };

  /**
   * index 위치의 상품만 수정 결과를 바꾼 새 목록으로 상태를 보낸다.
   * 항상 마지막으로 보낸 목록을 기준으로 바꾸므로, 앞에서 반영한 다른 상품의 결과가 유지된다.
   */
  const sendUpdate = (index: number, update: TargetProductUpdate): void =>
    sendState({
      targetProducts: state.targetProducts.map((target, targetIndex) =>
        targetIndex === index ? { ...target, update } : target,
      ),
    });

  return { sendState, sendUpdate };
};
