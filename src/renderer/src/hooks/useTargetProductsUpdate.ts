import { useEffect, useState } from 'react';
import type {
  InvalidProductRow,
  TargetProductWithUpdate,
  UpdateState,
} from '../../../domain/product/_type';

interface TargetProductsUpdate {
  targetProducts: TargetProductWithUpdate[];
  invalidProductRows: InvalidProductRow[];
  isPreparing: boolean;
  isRunning: boolean;
  currentProduct: TargetProductWithUpdate | undefined;
  currentOrder: number;
  errorMessage: string | null;
  // 재실행을 예약한 시각(Date.now() 기준 ms). 예약이 없으면 null
  nextRunAt: number | null;
  startUpdate: (restartDelayMinutes: number | null) => Promise<void>;
  stopUpdate: () => Promise<void>;
}

const initialUpdateState: UpdateState = {
  targetProducts: [],
  invalidProductRows: [],
  currentIndex: null,
  isPreparing: false,
  isRunning: false,
  errorMessage: null,
  nextRunAt: null,
};

/**
 * 가격 수정 순회는 main이 처리하고, 이 훅은 main이 보내는 상태를 구독해 화면에 넘기기만 한다.
 * 상태는 main이 매번 통째로 보내므로 받은 그대로 저장한다.
 */
const useTargetProductsUpdate = (): TargetProductsUpdate => {
  const [updateState, setUpdateState] = useState<UpdateState>(initialUpdateState);

  // onUpdateState가 반환하는 구독 해제 함수를 그대로 cleanup으로 넘긴다.
  useEffect(() => window.api.onUpdateState(setUpdateState), []);

  /**
   * 실패 이유도 main이 상태(errorMessage)로 보낸다.
   * 다시 시작하면 main이 빈 초기 상태부터 보내 이전 실패 이유도 함께 지워진다.
   * restartDelayMinutes가 null이면 자동 재실행 없이 한 번만 순회한다.
   */
  const startUpdate = async (restartDelayMinutes: number | null): Promise<void> => {
    await window.api.startUpdate(restartDelayMinutes);
  };

  // 취소하면 main이 nextRunAt을 지운 상태를 보낸다.
  const stopUpdate = async (): Promise<void> => {
    await window.api.stopUpdate();
  };

  const {
    targetProducts,
    invalidProductRows,
    currentIndex,
    isPreparing,
    isRunning,
    errorMessage,
    nextRunAt,
  } = updateState;

  // 진행 상태는 별도 state로 두지 않고 targetProducts와 currentIndex에서 계산한다.
  const currentProduct = currentIndex === null ? undefined : targetProducts.at(currentIndex);
  const currentOrder = currentIndex === null ? 0 : currentIndex + 1;

  return {
    targetProducts,
    invalidProductRows,
    isPreparing,
    isRunning,
    currentProduct,
    currentOrder,
    errorMessage,
    nextRunAt,
    startUpdate,
    stopUpdate,
  };
};

export default useTargetProductsUpdate;
