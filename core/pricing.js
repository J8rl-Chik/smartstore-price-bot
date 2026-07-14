// TODO: freeDeliveryPrice가 파싱 실패로 NaN이 되면 targetPrice도 NaN이 되는 잠재 버그가 있음.
// 현재는 기존 동작을 그대로 보존(캐릭터라이제이션)하고, 수정 여부는 별도 논의 후 결정.
export const calculateTargetPrice = (prices, freeDeliveryPrice) => {
  const minPrice = prices.find((price) => price >= freeDeliveryPrice + 10);

  return minPrice ? minPrice - 10 : freeDeliveryPrice;
};

export const isUpdateRequired = (myStore, targetPrice, feeType) => {
  if (!myStore) {
    return true;
  }

  return targetPrice !== myStore.price || feeType !== myStore.deliveryFeeType;
};
