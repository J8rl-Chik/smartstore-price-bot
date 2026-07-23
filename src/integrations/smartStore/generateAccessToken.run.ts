import 'dotenv/config';

import generateAccessToken from './generateAccessToken.js';
import isManualTestRun from '../../utils/isManualTestRun.js';

if (isManualTestRun(import.meta.url)) {
  generateAccessToken().then(() => {
    console.log('generateAccessToken 함수 테스트');
  });
}
