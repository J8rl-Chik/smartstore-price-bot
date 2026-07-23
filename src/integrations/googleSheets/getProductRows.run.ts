import 'dotenv/config';

import getProductRows from './getProductRows.js';
import isManualTestRun from '../../utils/isManualTestRun.js';
import { initProductRows } from '../../domain/productRow.js';

if (isManualTestRun(import.meta.url)) {
  getProductRows().then((productRows) => {
    console.log(`getProductRows 함수 테스트: ${initProductRows(productRows).length}개`);
  });
}
