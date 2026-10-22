import 'dotenv/config';

import getProductRows from './getProductRows.js';
import isManualTestRun from '../../utils/isManualTestRun.js';
import { parseProductRow } from '../../domain/product/parseProductRow.js';

if (isManualTestRun(import.meta.url)) {
  getProductRows().then((productRows) => {
    console.log(`getProductRows 함수 테스트: ${productRows.map(parseProductRow).length}개`);
  });
}
