import getSaleProducts from './getSaleProducts.js';
import isManualTestRun from '../../utils/isManualTestRun.js';
import { excludeNewlyRegisteredProducts } from '../../domain/saleProduct.js';

if (isManualTestRun(import.meta.url)) {
  getSaleProducts().then((saleProducts) =>
    console.log(
      `getSaleProducts 함수 테스트: ${excludeNewlyRegisteredProducts(saleProducts).length}개 판매 중`,
    ),
  );
}
