import type { ProductRow } from './_type.js';

export const findDuplicateProductNames = (productRows: ProductRow[]): string[] => {
  const checks = new Set<string>();
  const duplicates = new Set<string>();

  for (const { name } of productRows) {
    if (checks.has(name)) {
      duplicates.add(name);
    } else {
      checks.add(name);
    }
  }

  return [...duplicates];
};
