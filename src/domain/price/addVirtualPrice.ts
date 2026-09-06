export const addVirtualPrice = (prices: number[], virtualPrice: number | null): number[] =>
  virtualPrice ? [...prices, virtualPrice] : prices;
