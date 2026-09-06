import 'dotenv/config';

import getSaleProducts from './integrations/smartStore/getSaleProducts.js';
import getProductRows from './integrations/googleSheets/getProductRows.js';
import createPage from './integrations/puppeteer/createPage.js';
import getSellersInPuppeteer, {
  UnexpectedCatalogPageError,
} from './integrations/puppeteer/getSellersInPuppeteer.js';
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

// TODO: 분리할 필요있는지 확인, 에러 발생시 프로그램 종료되는지 확인.
const createLoggedInPage = async () => {
  const { browser, page } = await createPage();

  await loginNaver(page);
  await delaySeconds(1);

  return { browser, page };
};

const start = async (): Promise<void> => {
  const myStoreName = validateEnv('SMART_STORE_NAME');

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

      try {
        const sellers = await getSellersInPuppeteer(page, productRow.catalogURL, productName);

        // TODO: 판매처 목록 없으면 continue로 수정, else 제거.
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
      } catch (error) {
        if (error instanceof UnexpectedCatalogPageError) {
          throw error;
        }

        console.error(`${productName}: 처리 중 에러가 발생해 건너뜁니다.`, error);
      }

      await delaySeconds(10);
    }

    console.timeEnd('실행 시간');
    console.log(new Date().toLocaleString());

    await browser.close();
    await delayMinutes(5);
  }
};

await start();
