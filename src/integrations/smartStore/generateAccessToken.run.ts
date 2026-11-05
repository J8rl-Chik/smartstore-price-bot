import 'dotenv/config';

import generateAccessToken from './generateAccessToken.js';
import isManualTestRun from '../../utils/isManualTestRun.js';
import validateEnv from '../../utils/validateEnv.js';

if (isManualTestRun(import.meta.url)) {
  generateAccessToken({
    clientId: validateEnv('CLIENT_ID'),
    clientSecret: validateEnv('CLIENT_SECRET'),
  }).then(() => {
    console.log('generateAccessToken 함수 테스트');
  });
}
