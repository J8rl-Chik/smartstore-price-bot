import createPage from './createPage.js';
import isManualTestRun from '../../utils/isManualTestRun.js';

if (isManualTestRun(import.meta.url)) {
  createPage().then(() => {
    console.log('createPage 함수 테스트: 페이지 생성 완료');
  });
}
