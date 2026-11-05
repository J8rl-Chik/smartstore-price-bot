import 'dotenv/config';

import createPage from './createPage.js';
import loginNaver from './loginNaver.js';
import isManualTestRun from '../../utils/isManualTestRun.js';
import validateEnv from '../../utils/validateEnv.js';

if (isManualTestRun(import.meta.url)) {
  createPage().then(async ({ page }) => {
    await loginNaver(page, {
      naverId: validateEnv('NAVER_ID'),
      naverPassword: validateEnv('NAVER_PASSWORD'),
    });

    console.log('loginNaver 함수 테스트: 로그인 완료');
  });
}
