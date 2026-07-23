import 'dotenv/config';

import getSaleProducts from './integrations/smartStore/getSaleProducts.js';
import getProductRows from './integrations/googleSheets/getProductRows.js';
import createPage from './integrations/puppeteer/createPage.js';
import getSellersInPuppeteer from './integrations/puppeteer/getSellersInPuppeteer.js';
import loginNaver from './integrations/puppeteer/loginNaver.js';
import updatePrice from './integrations/smartStore/updatePrice.js';
import delaySeconds from './utils/delaySeconds.js';
import delayMinutes from './utils/delayMinutes.js';
import validateEnv from './utils/validateEnv.js';
import { initProductRows } from './domain/productRow.js';
import { getProductName, getOriginProductNo } from './domain/saleProduct.js';
import { filterExcludedSellers, addVirtualPrice } from './domain/sellers.js';
import { calculateTargetPrice, isUpdateRequired } from './domain/pricing.js';
import { buildPriceWithDeliveryFee, createDelivery } from './domain/delivery.js';

// 한 세션에서 너무 많은 상품을 연달아 조회하면 네이버가 봇으로 의심해 세션을 끊고 로그인
// 화면으로 돌려보낸다. 임계치(9~10개) 이전에 여유를 두고 브라우저를 새로 열어 재로그인한다.
const PRODUCTS_PER_BROWSER_SESSION = 7;

const createLoggedInPage = async () => {
  const { browser, page } = await createPage();

  await loginNaver(page);
  await delaySeconds(1);

  return { browser, page };
};

const start = async (): Promise<void> => {
  const myStoreName = validateEnv('SMART_STORE_NAME');

  /**
   * await start()로 자기 자신을 재귀 호출하면 바깥쪽 호출의 Promise가 안쪽 호출이
   * resolve되어야 같이 resolve되는데, 이 루프는 종료 조건이 없어 안쪽 Promise가
   * 영원히 resolve되지 않는다. 그러면 사이클마다 대기 중인 Promise 체인이 하나씩
   * 늘어나며 메모리를 계속 점유하므로, 재귀 대신 하나의 실행 컨텍스트 안에서
   * 반복되는 while 루프를 사용한다.
   */
  while (true) {
    console.time('실행 시간');

    const saleProducts = await getSaleProducts();
    const productRows = initProductRows(await getProductRows());
    let { browser, page } = await createLoggedInPage();
    let productCount = 0;

    for (const saleProduct of saleProducts) {
      const productName = getProductName(saleProduct);
      const productRow = productRows.find(({ name }) => name === productName);

      if (!productRow) {
        continue;
      }

      productCount += 1;
      console.log(`${productCount}번째: ${productName}`);

      const sellers = await getSellersInPuppeteer(page, productRow.catalogURL, productName);

      if (sellers.length === 0) {
        console.log(`${productName}: 가격 목록이 없습니다.`);
      } else {
        const currentMyStore = sellers.find(({ name }) => name === myStoreName);
        const sellerPrices = filterExcludedSellers(sellers, [
          ...productRow.excludedSellerNames,
          myStoreName,
        ]).map(({ price }) => price);
        const prices = addVirtualPrice(sellerPrices, productRow.virtualPrice);

        console.log(prices);

        const { freeDeliveryPrice, feeType, baseFee } = productRow;
        const targetPrice = calculateTargetPrice(prices, freeDeliveryPrice);

        if (isUpdateRequired(currentMyStore, targetPrice, feeType)) {
          const delivery = createDelivery({ feeType, baseFee });
          const { deliveryFee, salePrice } = buildPriceWithDeliveryFee(delivery, targetPrice);

          const result = await updatePrice({
            productNo: getOriginProductNo(saleProduct),
            deliveryFee,
            salePrice,
          });

          if (Object.hasOwn(result, 'message')) {
            console.error(`${productName}: ${result.message}`);
          }
        }
      }

      if (productCount % PRODUCTS_PER_BROWSER_SESSION === 0) {
        await browser.close();
        ({ browser, page } = await createLoggedInPage());
      }
    }

    console.timeEnd('실행 시간');
    console.log(new Date().toLocaleString());

    await browser.close();
    await delayMinutes(5);
  }
};

await start();
