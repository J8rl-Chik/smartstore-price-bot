import { Seller } from './_type.js';

export const filterExcludedSellers = (sellers: Seller[], excludedSellerNames: string[]): Seller[] =>
  sellers.filter(({ name }) => !excludedSellerNames.includes(name));
