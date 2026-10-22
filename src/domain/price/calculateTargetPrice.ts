export const calculateTargetPrice = (prices: number[], freeDeliveryPrice: number): number => {
  const sortedPrices = [...prices].sort((price1, price2) => price1 - price2);
  // 오름차순으로 정렬한 sortedPrices에서 freeDeliveryPrice + 10원 이상인 가격을 찾는다.
  const minPrice = sortedPrices.find((price) => price >= freeDeliveryPrice + 10);

  // 만약 freeDeliveryPrice + 10원 이상인 가격이 없으면, freeDeliveryPrice를 기준으로 판매가를 설정한다.
  // TODO: minPrice가 10원 단위로 떨어지지 않을 수 있어 minPrice - 10도 10원 단위가 아닐 수 있다. 10원 단위로 맞추는 조치가 필요하다.
  return minPrice ? minPrice - 10 : freeDeliveryPrice;
};
