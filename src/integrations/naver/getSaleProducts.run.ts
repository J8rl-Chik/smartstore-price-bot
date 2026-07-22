import getSaleProducts from './getSaleProducts.js';
import isManualTestRun from '../../util/isManualTestRun.js';
import { excludeNewlyRegisteredProducts } from '../../core/saleProduct.js';

if (isManualTestRun(import.meta.url)) {
  getSaleProducts().then((saleProducts) =>
    console.log(
      `getSaleProducts 함수 테스트: ${excludeNewlyRegisteredProducts(saleProducts).length}개 판매 중`,
    ),
  );
}
