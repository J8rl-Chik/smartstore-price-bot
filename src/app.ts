import 'dotenv/config';

import getSaleProducts from './integrations/smartStore/getSaleProducts.js';
import getProductRows from './integrations/googleSheets/getProductRows.js';
import createPage from './integrations/puppeteer/createPage.js';
import getSellersInPuppeteer, {
  UnexpectedCatalogPageError,
} from './integrations/puppeteer/getSellersInPuppeteer.js';
import updatePrice from './integrations/smartStore/updatePrice.js';
import delayMinutes from './utils/delayMinutes.js';
import delaySeconds from './utils/delaySeconds.js';
import validateEnv from './utils/validateEnv.js';
import { initProductRows } from './domain/productRow.js';
import { getProductName, getOriginProductNo } from './domain/saleProduct.js';
import { filterExcludedSellers, addVirtualPrice } from './domain/sellers.js';
import { calculateTargetPrice, isUpdateRequired } from './domain/pricing.js';
import { buildPriceWithDeliveryFee, createDelivery } from './domain/delivery.js';

/**
 * 상품 하나를 처리한 뒤 다음 상품으로 넘어가기까지 대기하는 시간.
 *
 * 네이버는 카탈로그 조회에 4~8분 슬라이딩 윈도우로 약 8회 상한을 건다. 브라우저를
 * 새로 열거나 계정을 바꿔도 우회되지 않으므로, 이 값이 곧 처리량의 상한이다.
 *
 * 홈 → 검색 → 카탈로그 경로로 측정했을 때 11초·30초 간격은 모두 8회째에 차단됐고,
 * 60초 간격만 33회까지 통과했다. 즉 60초는 통과가 확인된 최소값이므로 더 낮추지 않는다.
 *
 * 실제 간격은 여기에 조회 소요 시간(약 10초)이 더해져 70초 정도가 되는데, 60초가 통과
 * 경계선에 걸쳐 있던 값이라 이 여유분이 안전 마진이 된다.
 * 근거는 docs/naver-rate-limit.md 참고.
 */
const PRODUCT_INTERVAL_SECONDS = 10;

/**
 * 차단을 만났을 때 대기할 시간. 실측상 회복에 22분 초과 32분 이내가 걸렸고,
 * 그 사이에는 몇 번을 더 시도해도 계속 실패하므로 여유를 둬서 기다린다.
 */
const BLOCK_BACKOFF_MINUTES = 15;

/**
 * 브라우저 하나로 연속 조회하는 상품 수의 상한.
 *
 * 한 페이지를 오래 유지할수록 캐시·쿠키·메모리가 누적되는데, 그 누적 상태가 조회에
 * 어떤 영향을 주는지는 아직 확인되지 않았다. 영향 범위를 일정한 크기로 묶어두기 위해
 * 이 개수마다 브라우저를 닫고 새로 띄운다.
 */
const PRODUCTS_PER_BROWSER = 9;

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
    let { browser, page } = await createPage();
    let productCount = 0;

    for (const saleProduct of saleProducts) {
      const productName = getProductName(saleProduct);
      const productRow = productRows.find(({ name }) => name === productName);

      if (!productRow) {
        continue;
      }

      /**
       * 직전 상품까지 상한만큼 처리했다면 브라우저를 교체한다. 증가 전 productCount는
       * 이미 처리한 개수라 이 위치에서만 정확히 10개 주기가 된다.
       * 이전 브라우저를 닫지 않으면 크롬 프로세스가 계속 쌓여 메모리를 점유하므로,
       * 새로 띄우기 전에 반드시 닫는다.
       */
      if (productCount > 0 && productCount % PRODUCTS_PER_BROWSER === 0) {
        await delayMinutes(1);
      }

      ({ browser, page } = await createPage());

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
          /**
           * 조회 속도가 한도를 넘었다는 신호다. 다음 상품으로 넘어가봐야 회복 전까지는
           * 계속 실패하므로, 실행을 끝내지 말고 회복될 때까지 기다린 뒤 이어서 진행한다.
           * 여기서 프로세스를 죽이면 다음 실행이 상품 목록 앞쪽부터 다시 시작해
           * 뒤쪽 상품은 영영 갱신되지 않는다.
           */
          console.error(
            `${productName}: 접근이 제한돼 ${BLOCK_BACKOFF_MINUTES}분 대기 후 이어서 진행합니다.`,
          );
          console.error(`${productName}: 처리 중 에러가 발생해 건너뜁니다.`, error);

          await delayMinutes(BLOCK_BACKOFF_MINUTES);

          // ({ browser, page } = await createPage());

          // continue;
        }

        await browser.close();

        // 그 외 에러는 이 상품만의 문제일 수 있으니, 로그만 남기고 다음 상품으로 넘어간다.
        console.error(`${productName}: 처리 중 에러가 발생해 건너뜁니다.`, error);

        throw new Error('차단으로 인한 중단');
      }

      // await page.evaluate(() => {
      //   localStorage.clear();
      // });

      // const cookies = await browser.cookies();
      // await browser.deleteCookie(...cookies);

      // 조회 속도가 곧 처리량의 상한이므로, 다음 상품으로 넘어가기 전에 반드시 쉰다.
      await delaySeconds(PRODUCT_INTERVAL_SECONDS);

      await browser.close();
    }

    console.timeEnd('실행 시간');
    console.log(new Date().toLocaleString());

    await delayMinutes(5);
  }
};

await start();
