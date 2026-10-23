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
  startUpdate: () => Promise<void>;
}

const initialUpdateState: UpdateState = {
  targetProducts: [],
  invalidProductRows: [],
  currentIndex: null,
  isRunning: false,
};

/**
 * 가격 수정 순회는 main이 처리하고, 이 훅은 main이 보내는 상태를 구독해 화면에 넘기기만 한다.
 * 상태는 main이 매번 통째로 보내므로 받은 그대로 저장한다.
 */
const useTargetProductsUpdate = (): TargetProductsUpdate => {
  const [updateState, setUpdateState] = useState<UpdateState>(initialUpdateState);
  const [isLoading, setIsLoading] = useState(false);

  // onUpdateState가 반환하는 구독 해제 함수를 그대로 cleanup으로 넘긴다.
  useEffect(
    () =>
      window.api.onUpdateState((state) => {
        // 첫 상태는 main이 목록 조회와 로그인을 마친 뒤 보내므로, 상태를 받으면 로딩이 끝난 것이다.
        setIsLoading(false);
        setUpdateState(state);
      }),
    [],
  );

  const startUpdate = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await window.api.startUpdate();
    } finally {
      // main이 상태를 보내지 못하고 끝나도(목록 조회·로그인 실패) 로딩이 풀리도록 한다.
      setIsLoading(false);
    }
  };

  const { targetProducts, invalidProductRows, currentIndex } = updateState;

  // 진행 상태는 별도 state로 두지 않고 targetProducts와 currentIndex에서 계산한다.
  const currentProduct = currentIndex === null ? undefined : targetProducts.at(currentIndex);
  const currentOrder = currentIndex === null ? 0 : currentIndex + 1;

  return {
    targetProducts,
    invalidProductRows,
    isLoading,
    currentProduct,
    currentOrder,
    startUpdate,
  };
};

export default useTargetProductsUpdate;
