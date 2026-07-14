export const filterExcludedSellers = (sellers, myStoreName, excludedSellerNames) => {
  const allExcludedSellerNames = [myStoreName, ...excludedSellerNames];

  return sellers.filter(({ name }) => !allExcludedSellerNames.includes(name));
};

export const addVirtualSeller = (sellers, virtualPrice) => {
  if (!(virtualPrice > 0)) {
    return sellers;
  }

  return [...sellers, { name: '가상 판매처', price: virtualPrice }];
};

export const sortByPriceAscending = (sellers) =>
  [...sellers].sort((seller1, seller2) => seller1.price - seller2.price);
