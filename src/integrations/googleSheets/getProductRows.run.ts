import 'dotenv/config';

import getProductRows from './getProductRows.js';
import isManualTestRun from '../../utils/isManualTestRun.js';
import { initRawProductRows } from '../../domain/product/initRawProductRows.js';

if (isManualTestRun(import.meta.url)) {
  getProductRows().then((productRows) => {
    console.log(`getProductRows 함수 테스트: ${initRawProductRows(productRows).length}개`);
  });
}
