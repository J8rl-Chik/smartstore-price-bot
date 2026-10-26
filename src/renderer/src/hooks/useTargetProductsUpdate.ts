import { useEffect, useState } from 'react';
import type {
  InvalidProductRow,
  TargetProductWithUpdate,
  UpdateState,
} from '../../../domain/product/_type';

interface TargetProductsUpdate {
  targetProducts: TargetProductWithUpdate[];
  invalidProductRows: InvalidProductRow[];
  isLoading: boolean;
  currentProduct: TargetProductWithUpdate | undefined;
  currentOrder: number;
  // 목록 조회·로그인처럼 순회를 시작하기 전에 실패한 이유. 실패하지 않았으면 null
  startUpdateErrorMessage: string | null;
  startUpdate: () => Promise<void>;
}

const initialUpdateState: UpdateState = {
  targetProducts: [],
  invalidProductRows: [],
  currentIndex: null,
  isPreparing: false,
  isRunning: false,
};

/**
 * 가격 수정 순회는 main이 처리하고, 이 훅은 main이 보내는 상태를 구독해 화면에 넘기기만 한다.
 * 상태는 main이 매번 통째로 보내므로 받은 그대로 저장한다.
 */
const useTargetProductsUpdate = (): TargetProductsUpdate => {
  const [updateState, setUpdateState] = useState<UpdateState>(initialUpdateState);
  const [startUpdateErrorMessage, setStartUpdateErrorMessage] = useState<string | null>(null);

  // onUpdateState가 반환하는 구독 해제 함수를 그대로 cleanup으로 넘긴다.
  useEffect(() => window.api.onUpdateState(setUpdateState), []);

  const startUpdate = async (): Promise<void> => {
    // 다시 시작하면 이전 실패 이유를 지운다.
    setStartUpdateErrorMessage(null);

    const result = await window.api.startUpdate();

    if (result.status === 'error') {
      setStartUpdateErrorMessage(result.message);
    }
  };

  const { targetProducts, invalidProductRows, currentIndex, isPreparing } = updateState;

  // 진행 상태는 별도 state로 두지 않고 targetProducts와 currentIndex에서 계산한다.
  const currentProduct = currentIndex === null ? undefined : targetProducts.at(currentIndex);
  const currentOrder = currentIndex === null ? 0 : currentIndex + 1;

  return {
    targetProducts,
    invalidProductRows,
    // 화면은 main의 준비 단계를 로딩으로 보여준다.
    isLoading: isPreparing,
    currentProduct,
    currentOrder,
    startUpdateErrorMessage,
    startUpdate,
  };
};

export default useTargetProductsUpdate;
