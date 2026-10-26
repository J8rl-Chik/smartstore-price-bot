import type { WebContents } from 'electron';
import type {
  InvalidProductRow,
  TargetProduct,
  TargetProductUpdate,
  TargetProductWithUpdate,
  UpdateState,
} from '../domain/product/_type';
import { UPDATE_STATE_CHANNEL } from '../preload/ipcChannel';

let state: UpdateState = {
  targetProducts: [],
  invalidProductRows: [],
  currentIndex: null,
  isPreparing: false,
  isRunning: false,
};

/**
 * 순회를 시작할 때의 상태로 state를 초기화하고, 초기화한 상태를 반환한다.
 * 상품 전체를 wait로 두고, 아직 처리 중인 상품은 없다. 변환에 실패한 시트 행은 그대로 담는다.
 * 준비(목록 조회·로그인)를 마친 뒤 호출하므로 isPreparing은 false다.
 */
export const initState = (
  targetProducts: TargetProduct[],
  invalidProductRows: InvalidProductRow[],
): UpdateState => {
  state = {
    targetProducts: targetProducts.map((targetProduct) => ({
      ...targetProduct,
      update: { status: 'wait' },
    })),
    invalidProductRows,
    currentIndex: null,
    isPreparing: false,
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
  sender.send(UPDATE_STATE_CHANNEL, nextState);
};
