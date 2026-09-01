export interface Seller {
  name: string;
  price: number;
  deliveryFee: number;
  deliveryFeeType: string;
}

export const filterExcludedSellers = (sellers: Seller[], excludedSellerNames: string[]): Seller[] =>
  sellers.filter(({ name }) => !excludedSellerNames.includes(name));

export const addVirtualPrice = (prices: number[], virtualPrice: number | null): number[] =>
  virtualPrice ? [...prices, virtualPrice] : prices;
