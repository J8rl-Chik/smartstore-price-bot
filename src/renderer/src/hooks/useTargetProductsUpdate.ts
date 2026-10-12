import { useState } from 'react';
import type { TargetProduct } from '../../../domain/product/_type';
import delaySeconds from '../../../utils/delaySeconds';

interface TargetProductsUpdate {
  targetProducts: TargetProduct[];
  isLoading: boolean;
  currentProduct: TargetProduct | undefined;
  currentOrder: number;
  start: () => Promise<void>;
}

const useTargetProductsUpdate = (): TargetProductsUpdate => {
  const [targetProducts, setTargetProducts] = useState<TargetProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const start = async (): Promise<void> => {
    setIsLoading(true);

    const response = await window.api.getTargetProducts();
    // TODO: response의 isSuccess가 false인 경우 예외 처리
    const targetProductsResult = response.isSuccess ? response.targetProducts : [];

    setIsLoading(false);
    setTargetProducts(targetProductsResult);

    if (targetProductsResult.length === 0) {
      return;
    }

    await window.api.createLoginPage();

    try {
      for (const [index, targetProduct] of targetProductsResult.entries()) {
        setCurrentIndex(index);

        // TODO: updatePrice는 main 프로세스 전용 함수라 여기서 직접 호출 불가. IPC로 노출한 뒤 교체 필요.
        const updatedTargetProduct = targetProduct;

        const sellersResponse = await window.api.getSellers(
          targetProduct.catalogURL,
          targetProduct.name,
        );

        // TODO: 임시 조치. 실패하면 순회를 중단한다. 브라우저 종료 같은 치명적인 실패와 개별 상품의 일시적 실패를 구분해 처리해야 한다.
        if (!sellersResponse.isSuccess) {
          break;
        }

        setTargetProducts((prev) =>
          prev.map((target) => (target === targetProduct ? updatedTargetProduct : target)),
        );

        await delaySeconds(5);
      }
    } finally {
      setCurrentIndex(null);
    }
  };

  // 진행 상태는 별도 state로 두지 않고 targetProducts와 currentIndex에서 계산한다.
  const currentProduct = currentIndex === null ? undefined : targetProducts.at(currentIndex);
  const currentOrder = currentIndex === null ? 0 : currentIndex + 1;

  return { targetProducts, isLoading, currentProduct, currentOrder, start };
};

export default useTargetProductsUpdate;
