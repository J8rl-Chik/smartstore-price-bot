import { Seller } from '../seller/filterExcludedSellers.js';

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
