import createPage from './createPage.js';
import loginNaver from './loginNaver.js';
import isManualTestRun from '../../utils/isManualTestRun.js';

if (isManualTestRun(import.meta.url)) {
  createPage().then(async ({ page }) => {
    await loginNaver(page);

    console.log('loginNaver 함수 테스트: 로그인 완료');
  });
}
