import { ipcMain } from 'electron';
import type { Page } from 'puppeteer';
import { IpcEvent } from '../preload/_type';
import createPage from '../integrations/puppeteer/createPage';
import loginNaver from '../integrations/puppeteer/loginNaver';
import getSaleProducts from '../integrations/smartStore/getSaleProducts';
import getSellersInPuppeteer from '../integrations/puppeteer/getSellersInPuppeteer';
import getProductRows from '../integrations/googleSheets/getProductRows';
import { excludeNewlyRegisteredProducts } from '../domain/product/saleProduct';
import { initRawProductRows } from '../domain/product/initRawProductRows';
import { createTargetProducts } from '../domain/product/createTargetProducts';
import { findDuplicateProductNames } from '../domain/product/findDuplicateProductNames';
import shuffleArray from '../utils/shuffleArray';

// 채널 이름(K)에 맞는 요청 인자와 응답 타입을 강제하는 ipcMain.handle 래퍼
const handleIpc = <E extends keyof IpcEvent>(
  event: E,
  handler: (...args: Parameters<IpcEvent[E]>) => ReturnType<IpcEvent[E]>,
): void => {
  // ipcMain.handle 콜백의 첫 번째 인자(IpcMainInvokeEvent)는 렌더러가 보낸 값이 아니므로 제외하고 나머지만 handler에 전달한다.
  ipcMain.handle(event, (_event, ...args) => handler(...(args as Parameters<IpcEvent[E]>)));
};

export const registerIpcHandlers = (): void => {
  /**
   * 로그인 이후 가격 수집 핸들러가 같은 페이지를 쓰도록 핸들러 간에 공유한다.
   * TODO: page 공유 상태를 싱글톤 패턴으로 분리하는 리팩토링을 고려한다.
   * TODO: browser를 닫을 수 있도록 browser와 page를 하나로 묶어 보관하고, 종료 시 browser.close()를 호출한다.
   */
  let page: Page | null = null;

  // TODO: 로그인 페이지 생성에 실패했을 때의 예외 처리를 추가한다.
  handleIpc('createLoginPage', async () => {
    ({ page } = await createPage());

    await loginNaver(page);
  });

  handleIpc('getTargetProducts', async () => {
    try {
      const [saleProducts, rawProductRows] = await Promise.all([
        getSaleProducts(),
        getProductRows(),
      ]);

      const shuffledSaleProducts = shuffleArray(excludeNewlyRegisteredProducts(saleProducts));
      const productRows = initRawProductRows(rawProductRows);
      const duplicateProductNames = findDuplicateProductNames(productRows);
      const targetProducts = createTargetProducts(shuffledSaleProducts, productRows);

      return { isSuccess: true, targetProducts, duplicateProductNames } as const;
    } catch (error) {
      console.error(error);

      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : String(`getTargetProducts 에러: ${error}`),
      } as const;
    }
  });

  handleIpc('getSellers', async (catalogURL, productName) => {
    if (!page) {
      return { isSuccess: false, error: '로그인 페이지가 생성되지 않았습니다.' } as const;
    }

    try {
      const sellers = await getSellersInPuppeteer(page, catalogURL, productName);

      return { isSuccess: true, sellers } as const;
    } catch (error) {
      console.error(error);

      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : String(`getSellers 에러: ${error}`),
      } as const;
    }
  });
};
