import 'dotenv/config';

import getProductRows from './getProductRows.js';
import isManualTestRun from '../../utils/isManualTestRun.js';
import validateEnv from '../../utils/validateEnv.js';
import { parseProductRow } from '../../domain/product/parseProductRow.js';

if (isManualTestRun(import.meta.url)) {
  getProductRows({
    sheetId: validateEnv('SHEET_ID'),
    sheetName: validateEnv('SHEET_NAME'),
    auth: { keyFile: 'config/googleSheetKey.json' },
  }).then((productRows) => {
    console.log(`getProductRows 함수 테스트: ${productRows.map(parseProductRow).length}개`);
  });
}
