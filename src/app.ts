import 'dotenv/config';

import getSaleProducts from './integrations/naver/getSaleProducts.js';
import getProductRows from './integrations/google/getProductRows.js';
import createPage from './integrations/puppeteer/createPage.js';
import getSellersInPuppeteer from './integrations/puppeteer/getSellersInPuppeteer.js';
import loginNaver from './integrations/puppeteer/loginNaver.js';
import updatePrice from './integrations/naver/updatePrice.js';
import delaySeconds from './util/delaySeconds.js';
import delayMinutes from './util/delayMinutes.js';
import validateEnv from './util/validateEnv.js';
import { initProductRows } from './core/productRow.js';
import { getProductName, getOriginProductNo } from './core/saleProduct.js';
import { filterExcludedSellers, addVirtualPrice } from './core/sellers.js';
import { calculateTargetPrice, isUpdateRequired } from './core/pricing.js';
import { buildPriceWithDeliveryFee, createDelivery } from './core/delivery.js';

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
    const { browser, page } = await createPage();
    let productCount = 0;

    await loginNaver(page);
    await delaySeconds(1);

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

        continue;
      }

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

    console.timeEnd('실행 시간');
    console.log(new Date().toLocaleString());

    await browser.close();
    await delayMinutes(5);
  }
};

await start();
