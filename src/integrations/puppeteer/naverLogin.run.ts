import createPage from './createPage.js';
import naverLogin from './naverLogin.js';
import isManualTestRun from '../../util/isManualTestRun.js';

if (isManualTestRun(import.meta.url)) {
  createPage().then(async (page) => {
    await naverLogin(page);

    console.log('naverLogin 함수 테스트: 로그인 완료');
  });
}
