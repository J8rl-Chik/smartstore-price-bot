import { ipcMain } from 'electron';
import type { Page } from 'puppeteer';
import { IpcEvent } from '../preload/_type';
import createPage from '../integrations/puppeteer/createPage';
import loginNaver from '../integrations/puppeteer/loginNaver';
import getSaleProducts from '../integrations/smartStore/getSaleProducts';
import getProductRows from '../integrations/googleSheets/getProductRows';
import { excludeNewlyRegisteredProducts } from '../domain/product/saleProduct';
import { initRawProductRows } from '../domain/product/initRawProductRows';
import { createTargetProducts } from '../domain/product/createTargetProducts';
import { findDuplicateProductNames } from '../domain/product/findDuplicateProductNames';
import shuffleArray from '../utils/shuffleArray';
import validateEnv from '../utils/validateEnv';
import updateTargetProducts from './updateTargetProducts';
import type { UpdateState } from '../domain/product/_type';

// main이 순회 상태를 push하는 채널 이름. preload/exposeApi.ts의 구독과 이름이 같아야 한다.
const UPDATE_STATE_CHANNEL = 'updateState';

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

  /**
   * 상품 목록 전체의 가격 수정 순회를 시작한다. handleIpc는 sender(WebContents)를 전달하지 않아
   * updateState를 push해야 하는 이 핸들러만 ipcMain.handle을 직접 사용한다.
   */
  ipcMain.handle(
    'startUpdate',
    async (event, targetProducts: Parameters<IpcEvent['startUpdate']>[0]) => {
      if (!page) {
        console.error('startUpdate: 로그인 페이지가 생성되지 않았습니다.');

        return;
      }

      try {
        const myStoreName = validateEnv('SMART_STORE_NAME');
        const emit = (state: UpdateState): void => {
          event.sender.send(UPDATE_STATE_CHANNEL, state);
        };

        await updateTargetProducts(page, targetProducts, myStoreName, emit);
      } catch (error) {
        console.error(error);
      }
    },
  );
};
