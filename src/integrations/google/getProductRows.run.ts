import 'dotenv/config';

import getProductRows from './getProductRows.js';
import isManualTestRun from '../../util/isManualTestRun.js';
import { initProductRow } from '../../core/productRow.js';

if (isManualTestRun(import.meta.url)) {
  getProductRows().then((productRows) => {
    console.log(`getProductRows 함수 테스트: ${initProductRow(productRows).length}개`);
  });
}
