import 'dotenv/config';

import getSaleProducts from './getSaleProducts.js';
import isManualTestRun from '../../utils/isManualTestRun.js';
import validateEnv from '../../utils/validateEnv.js';
import { excludeNewlyRegisteredProducts } from '../../domain/product/saleProduct.js';

if (isManualTestRun(import.meta.url)) {
  getSaleProducts({
    clientId: validateEnv('CLIENT_ID'),
    clientSecret: validateEnv('CLIENT_SECRET'),
  }).then((saleProducts) =>
    console.log(
      `getSaleProducts 함수 테스트: ${excludeNewlyRegisteredProducts(saleProducts).length}개 판매 중`,
    ),
  );
}
