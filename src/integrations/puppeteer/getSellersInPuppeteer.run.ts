import createPage from './createPage.js';
import loginNaver from './loginNaver.js';
import getSellersInPuppeteer from './getSellersInPuppeteer.js';
import delaySeconds from '../../util/delaySeconds.js';
import isManualTestRun from '../../util/isManualTestRun.js';

if (isManualTestRun(import.meta.url)) {
  createPage().then(async ({ page }) => {
    await loginNaver(page);
    await delaySeconds(1);

    const productURL =
      'https://search.shopping.naver.com/catalog/60370364009?query=%EC%97%90%EC%8A%A4%ED%8A%B8%EB%9D%BC%20%EC%95%84%ED%86%A0%EB%B2%A0%EB%A6%AC%EC%96%B4365%20%ED%95%98%EC%9D%B4%EB%93%9C%EB%A1%9C%20%EC%88%98%EB%94%A9%20%ED%81%AC%EB%A6%BC%2080ml%28%EC%8B%A0%ED%98%95%29%201%EA%B0%9C&NaPm=ct%3Dmrkhiq8w%7Cci%3Dbe6e7645484243a838254c425f8764327a91f069%7Ctr%3Dslsl%7Csn%3D95694%7Chk%3D057a1b48ceb53e55a341703b09c73ed7706974ea';
    const productName = '에스트라 아토베리어365 하이드로 수딩 크림 80ml(신형) 1개';

    const sellers = await getSellersInPuppeteer(page, productURL, productName);

    console.log(sellers);

    await page.close();
  });
}
