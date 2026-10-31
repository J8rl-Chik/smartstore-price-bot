import getSaleProducts from '../integrations/smartStore/getSaleProducts';
import getProductRows from '../integrations/googleSheets/getProductRows';
import { excludeNewlyRegisteredProducts, getProductName } from '../domain/product/saleProduct';
import { parseProductRow } from '../domain/product/parseProductRow';
import { createTargetProducts } from '../domain/product/createTargetProducts';
import { findDuplicateProductNames } from '../domain/product/findDuplicateProductNames';
import shuffleArray from '../utils/shuffleArray';
import type { InvalidProductRow, TargetProduct } from '../domain/product/_type';

// 네이버 판매 상품과 구글 시트 행을 합쳐 가격 수정 대상 목록, 중복된 상품명, 변환에 실패한 시트 행을 만든다.
const fetchTargetProducts = async (): Promise<{
  targetProducts: TargetProduct[];
  duplicateProductNames: string[];
  invalidProductRows: InvalidProductRow[];
}> => {
  const [saleProducts, rawProductRows] = await Promise.all([getSaleProducts(), getProductRows()]);
  const shuffledSaleProducts = shuffleArray(excludeNewlyRegisteredProducts(saleProducts));
  const productRowResults = rawProductRows.map(parseProductRow);

  // 변환에 성공한 행은 가격 수정에 쓰고, 실패한 행은 어떤 행을 왜 고쳐야 하는지 renderer에 보여주도록 모은다.
  const validProductRows = productRowResults
    .filter((result) => result.status === 'ok')
    .map(({ productRow }) => productRow);

  // 판매 중이 아닌 상품의 행은 고쳐도 가격 수정 대상이 되지 않으므로, 판매 상품에 이름이 있는 실패 행만 보낸다.
  const saleProductNames = new Set(shuffledSaleProducts.map(getProductName));
  const invalidProductRows = productRowResults
    .filter((result) => result.status === 'error')
    .filter(({ productRow }) => saleProductNames.has(productRow.name))
    .map(({ productRow, errorMessages }) => ({ name: productRow.name, errorMessages }));

  const duplicateProductNames = findDuplicateProductNames(validProductRows);
  const targetProducts = createTargetProducts(shuffledSaleProducts, validProductRows);

  return { targetProducts, duplicateProductNames, invalidProductRows };
};

export default fetchTargetProducts;
