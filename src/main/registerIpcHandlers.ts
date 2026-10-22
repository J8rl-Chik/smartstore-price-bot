import { ipcMain, type WebContents } from 'electron';
import type { Page } from 'puppeteer';
import { IpcInvoke } from '../preload/_type';
import createPage from '../integrations/puppeteer/createPage';
import loginNaver from '../integrations/puppeteer/loginNaver';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import getSaleProducts from '../integrations/smartStore/getSaleProducts';
import getProductRows from '../integrations/googleSheets/getProductRows';
import { excludeNewlyRegisteredProducts } from '../domain/product/saleProduct';
import { parseProductRow } from '../domain/product/parseProductRow';
import { createTargetProducts } from '../domain/product/createTargetProducts';
import { findDuplicateProductNames } from '../domain/product/findDuplicateProductNames';
import shuffleArray from '../utils/shuffleArray';
import validateEnv from '../utils/validateEnv';
import delaySeconds from '../utils/delaySeconds';
import tryCatch from '../utils/tryCatch';
import updateTargetProductPrice from './updateTargetProductPrice';
import { initState, sendState, setState, setUpdate } from './state';
import type { TargetProduct } from '../domain/product/_type';

/**
 * 채널 이름(K)에 맞는 요청 인자와 응답 타입을 강제하는 ipcMain.handle 래퍼.
 * 요청한 창(sender)은 렌더러가 보낸 인자 뒤에 붙여 전달한다. 쓰지 않는 핸들러는 받지 않아도 된다.
 */
const handleIpc = <E extends keyof IpcInvoke>(
  event: E,
  handler: (...args: [...Parameters<IpcInvoke[E]>, WebContents]) => ReturnType<IpcInvoke[E]>,
): void => {
  // ipcMain.handle 콜백의 첫 번째 인자(IpcMainInvokeEvent)는 렌더러가 보낸 값이 아니므로 sender만 꺼내 handler에 전달한다.
  ipcMain.handle(event, (ipcEvent, ...args) =>
    handler(...(args as Parameters<IpcInvoke[E]>), ipcEvent.sender),
  );
};

// 네이버 판매 상품과 구글 시트 행을 합쳐 가격 수정 대상 목록과 중복된 상품명을 만든다.
const fetchTargetProducts = async (): Promise<{
  targetProducts: TargetProduct[];
  duplicateProductNames: string[];
}> => {
  const [saleProducts, rawProductRows] = await Promise.all([getSaleProducts(), getProductRows()]);

  const shuffledSaleProducts = shuffleArray(excludeNewlyRegisteredProducts(saleProducts));
  // TODO: 3단계에서 변환에 실패한 행도 renderer로 보낸다. 지금은 변환에 성공한 행만 쓴다.
  const productRows = rawProductRows
    .map(parseProductRow)
    .flatMap((result) => (result.status === 'ok' ? [result.productRow] : []));
  const duplicateProductNames = findDuplicateProductNames(productRows);
  const targetProducts = createTargetProducts(shuffledSaleProducts, productRows);

  return { targetProducts, duplicateProductNames };
};

export const registerIpcHandlers = (): void => {
  /**
   * startUpdate를 다시 호출해도 다시 로그인하지 않도록 로그인한 페이지를 보관한다.
   * TODO: page 공유 상태를 싱글톤 패턴으로 분리하는 리팩토링을 고려한다.
   * TODO: browser를 닫을 수 있도록 browser와 page를 하나로 묶어 보관하고, 종료 시 browser.close()를 호출한다.
   */
  let page: Page | null = null;
  // 순회가 도는 중에 startUpdate가 다시 들어오면 같은 page로 순회가 두 개 돌지 않도록 막는다.
  let isUpdateRunning = false;

  /**
   * 상품 목록 조회, 로그인, 가격 수정 순회까지 main에서 처리한다.
   * 진행 상태는 응답이 아니라 updateState 채널로 요청한 창에 보낸다.
   * TODO: 목록 조회·로그인 실패를 renderer에 알리는 방법을 추가한다.
   */
  handleIpc('startUpdate', async (sender) => {
    if (isUpdateRunning) {
      return;
    }

    isUpdateRunning = true;

    try {
      const myStoreName = validateEnv('SMART_STORE_NAME');
      const { targetProducts } = await fetchTargetProducts();

      // 수정할 상품이 없으면 로그인하지 않고, 빈 목록으로 끝난 상태만 보낸다.
      if (targetProducts.length === 0) {
        sendState(sender, { targetProducts: [], currentIndex: null, isRunning: false });

        return;
      }

      // 이미 로그인한 페이지가 있으면 다시 로그인하지 않고 재사용한다.
      if (!page) {
        page = (await createPage()).page;

        await loginNaver(page);
      }

      sendState(sender, initState(targetProducts));

      /**
       * 상품 하나의 실패는 그 상품만 error로 반영하고 계속하며,
       * 네이버 쇼핑 접속 제한(UnexpectedCatalogPageError)처럼 다음 상품도 실패할 치명적 실패는 error로 반영한 뒤 중단한다.
       */
      for (const [index, targetProduct] of targetProducts.entries()) {
        sendState(sender, setState({ currentIndex: index }));

        const [error, update] = await tryCatch(
          updateTargetProductPrice(page, targetProduct, myStoreName),
        );

        if (error) {
          console.error(error);
        }

        sendState(sender, setUpdate(index, update ?? { status: 'error', time: Date.now() }));

        // 다음 상품도 실패할 치명적 실패면 순회를 멈춘다.
        if (error instanceof UnexpectedCatalogPageError) {
          break;
        }

        await delaySeconds(5);
      }

      sendState(sender, setState({ currentIndex: null, isRunning: false }));
    } catch (error) {
      console.error(error);
    } finally {
      isUpdateRunning = false;
    }
  });
};
