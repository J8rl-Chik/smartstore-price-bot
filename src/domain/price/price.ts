import { Seller } from '../seller/filterExcludedSellers.js';

export const calculateTargetPrice = (prices: number[], freeDeliveryPrice: number): number => {
  const sortedPrices = [...prices].sort((price1, price2) => price1 - price2);
  // 오름차순으로 정렬한 sortedPrices에서 freeDeliveryPrice + 10원 이상인 가격을 찾는다.
  const minPrice = sortedPrices.find((price) => price >= freeDeliveryPrice + 10);

  // 만약 freeDeliveryPrice + 10원 이상인 가격이 없으면, freeDeliveryPrice를 기준으로 판매가를 설정한다.
  return minPrice ? minPrice - 10 : freeDeliveryPrice;
};

export const isPriceUpdateRequired = (
  currentMyStore: Pick<Seller, 'price' | 'deliveryFeeType'> | undefined,
  targetPrice: number,
  feeType: string,
): boolean => {
  // 가격비교 페이지에서 가격이 순위권에서 밀려나면 currentMyStore는 undefined
  if (!currentMyStore) {
    return true;
  }

  return targetPrice !== currentMyStore.price || feeType !== currentMyStore.deliveryFeeType;
};
