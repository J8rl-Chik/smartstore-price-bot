import { useEffect, useState } from 'react';
import type { TargetProductWithUpdate, UpdateState } from '../../../domain/product/_type';

interface TargetProductsUpdate {
  targetProducts: TargetProductWithUpdate[];
  isLoading: boolean;
  currentProduct: TargetProductWithUpdate | undefined;
  currentOrder: number;
  start: () => Promise<void>;
}

const INITIAL_UPDATE_STATE: UpdateState = {
  targetProducts: [],
  currentIndex: null,
  isRunning: false,
};

const useTargetProductsUpdate = (): TargetProductsUpdate => {
  const [updateState, setUpdateState] = useState<UpdateState>(INITIAL_UPDATE_STATE);
  const [isLoading, setIsLoading] = useState(false);

  // main이 순회 상태가 바뀔 때마다 push하는 updateState를 그대로 반영한다. 순회 로직은 main이 갖고 있어 여기서는 모른다.
  useEffect(() => window.api.onUpdateState(setUpdateState), []);

  const start = async (): Promise<void> => {
    setIsLoading(true);

    const response = await window.api.getTargetProducts();
    // TODO: response의 isSuccess가 false인 경우 예외 처리
    const targetProducts = response.isSuccess ? response.targetProducts : [];

    setIsLoading(false);
    // startUpdate가 첫 updateState를 push하기 전에도 바로 목록을 보여줄 수 있도록 wait 상태로 먼저 반영한다.
    // main이 보내는 첫 updateState도 같은 내용이라 덮어써도 차이가 없다.
    setUpdateState({
      targetProducts: targetProducts.map((targetProduct) => ({
        ...targetProduct,
        update: { status: 'wait' },
      })),
      currentIndex: null,
      isRunning: false,
    });

    if (targetProducts.length === 0) {
      return;
    }

    await window.api.createLoginPage();
    await window.api.startUpdate(targetProducts);
  };

  const { targetProducts, currentIndex } = updateState;
  // 진행 상태는 별도 state로 두지 않고 updateState의 currentIndex에서 계산한다.
  const currentProduct = currentIndex === null ? undefined : targetProducts.at(currentIndex);
  const currentOrder = currentIndex === null ? 0 : currentIndex + 1;

  return { targetProducts, isLoading, currentProduct, currentOrder, start };
};

export default useTargetProductsUpdate;
