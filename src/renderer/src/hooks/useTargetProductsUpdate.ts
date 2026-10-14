import { useState } from 'react';
import { addVirtualPrice } from '../../../domain/price/addVirtualPrice';
import delaySeconds from '../../../utils/delaySeconds';
import type { TargetProductWithUpdate } from './_type';

interface TargetProductsUpdate {
  targetProducts: TargetProductWithUpdate[];
  isLoading: boolean;
  currentProduct: TargetProductWithUpdate | undefined;
  currentOrder: number;
  start: () => Promise<void>;
}

const useTargetProductsUpdate = (): TargetProductsUpdate => {
  const [targetProducts, setTargetProducts] = useState<TargetProductWithUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const start = async (): Promise<void> => {
    setIsLoading(true);

    const response = await window.api.getTargetProducts();
    // TODO: response의 isSuccess가 false인 경우 예외 처리
    const targetProductsResult = response.isSuccess ? response.targetProducts : [];
    const waitingTargetProducts = targetProductsResult.map(
      (targetProduct): TargetProductWithUpdate => ({
        ...targetProduct,
        update: { status: 'wait' },
      }),
    );

    setIsLoading(false);
    setTargetProducts(waitingTargetProducts);

    if (waitingTargetProducts.length === 0) {
      return;
    }

    await window.api.createLoginPage();

    try {
      for (const [index, targetProduct] of waitingTargetProducts.entries()) {
        setCurrentIndex(index);

        const sellersResponse = await window.api.getSellers(
          targetProduct.catalogURL,
          targetProduct.name,
        );

        // TODO: 임시 조치. 실패하면 순회를 중단한다. 브라우저 종료 같은 치명적인 실패와 개별 상품의 일시적 실패를 구분해 처리해야 한다.
        if (!sellersResponse.isSuccess) {
          break;
        }

        const filteredSellersResponse = await window.api.filterSellers(
          sellersResponse.sellers,
          targetProduct.excludedSellerNames,
        );

        if (!filteredSellersResponse.isSuccess) {
          break;
        }

        const sellerPrices = filteredSellersResponse.sellers.map(({ price }) => price);
        const prices = addVirtualPrice(sellerPrices, targetProduct.virtualPrice);
        const targetPriceResponse = await window.api.getTargetPrice(
          prices,
          targetProduct.freeDeliveryPrice,
        );

        if (!targetPriceResponse.isSuccess) {
          break;
        }

        const updatePriceResponse = await window.api.updatePrice(
          targetProduct.originProductNo,
          targetPriceResponse.targetPrice,
          targetProduct.delivery,
        );

        if (!updatePriceResponse.isSuccess) {
          break;
        }

        const updatedTargetProduct: TargetProductWithUpdate = {
          ...targetProduct,
          update: {
            status: 'done',
            price: updatePriceResponse.salePrice,
            baseFee: updatePriceResponse.baseFee,
            updatedAt: Date.now(),
          },
        };

        setTargetProducts((prev) =>
          prev.map((target) =>
            target.originProductNo === updatedTargetProduct.originProductNo
              ? updatedTargetProduct
              : target,
          ),
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
