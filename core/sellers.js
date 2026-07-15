export const filterExcludedSellers = (sellers, excludedSellerNames) =>
  sellers.filter(({ name }) => !excludedSellerNames.includes(name));

export const addVirtualPrice = (prices, virtualPrice) =>
  virtualPrice ? [...prices, virtualPrice] : prices;
