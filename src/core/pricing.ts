import type { Seller } from './sellers.js';

/**
 * prices가 오름차순 정렬되어 있어야 find()가 최저가를 반환하므로, 호출부가 정렬 여부를
 * 신경 쓰지 않도록 여기서 직접 정렬한다.
 */
export const calculateTargetPrice = (prices: number[], freeDeliveryPrice: number): number => {
  const sortedPrices = [...prices].sort((price1, price2) => price1 - price2);
  // freeDeliveryPrice + 10원 이상인 가격 중 최저가(이 가격보다 10원 낮게 판매가를 설정하기 위함)
  const minPrice = sortedPrices.find((price) => price >= freeDeliveryPrice + 10);

  return minPrice ? minPrice - 10 : freeDeliveryPrice;
};

export const isUpdateRequired = (
  currentMyStore: Pick<Seller, 'price' | 'deliveryFeeType'> | undefined,
  targetPrice: number,
  feeType: string,
): boolean => {
  if (!currentMyStore) {
    return true;
  }

  return targetPrice !== currentMyStore.price || feeType !== currentMyStore.deliveryFeeType;
};
