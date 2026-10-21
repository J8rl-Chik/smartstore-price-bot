import type { WebContents } from 'electron';
import type {
  TargetProduct,
  TargetProductUpdate,
  TargetProductWithUpdate,
  UpdateState,
} from '../domain/product/_type';

// main이 순회 상태를 보내는 채널 이름. preload/exposeApi.ts의 구독 채널 이름과 같아야 한다.
const updateStateChannel = 'updateState';

let state: UpdateState = { targetProducts: [], currentIndex: null, isRunning: false };

/**
 * 순회를 시작할 때의 상태로 state를 초기화하고, 초기화한 상태를 반환한다.
 * 상품 전체를 wait로 두고, 아직 처리 중인 상품은 없다.
 */
export const initState = (targetProducts: TargetProduct[]): UpdateState => {
  state = {
    targetProducts: targetProducts.map((targetProduct) => ({
      ...targetProduct,
      update: { status: 'wait' },
    })),
    currentIndex: null,
    isRunning: true,
  };

  return state;
};

// index 위치의 상품만 수정 결과를 바꾼 새 목록을 만든다.
const replaceTargetProductUpdate = (
  targetProducts: TargetProductWithUpdate[],
  index: number,
  update: TargetProductUpdate,
): TargetProductWithUpdate[] =>
  targetProducts.map((target, targetIndex) =>
    targetIndex === index ? { ...target, update } : target,
  );

// 바뀐 값만 state에 덮어쓰고, 갱신한 상태를 반환한다.
export const setState = (nextState: Partial<UpdateState>): UpdateState => {
  state = { ...state, ...nextState };

  return state;
};

// index 위치의 상품만 수정 결과를 바꿔 state를 갱신하고, 갱신한 상태를 반환한다.
export const setUpdate = (index: number, update: TargetProductUpdate): UpdateState =>
  setState({ targetProducts: replaceTargetProductUpdate(state.targetProducts, index, update) });

// 상태가 바뀔 때마다 상태 전체를 요청한 창의 updateState 채널로 보낸다.
export const sendState = (sender: WebContents, nextState: UpdateState): void => {
  sender.send(updateStateChannel, nextState);
};
