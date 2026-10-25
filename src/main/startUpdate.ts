import type { WebContents } from 'electron';
import type { Page } from 'puppeteer';
import createPage from '../integrations/puppeteer/createPage';
import loginNaver from '../integrations/puppeteer/loginNaver';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import validateEnv from '../utils/validateEnv';
import delaySeconds from '../utils/delaySeconds';
import tryCatch from '../utils/tryCatch';
import fetchTargetProducts from './fetchTargetProducts';
import updateTargetProductPrice from './updateTargetProductPrice';
import { initState, sendState, setState, setUpdate } from './state';

/**
 * 사용자가 puppeteer 브라우저의 탭이나 창을 닫았는지 확인한다.
 * 탭만 닫으면 page가 닫히고, 창을 닫으면 브라우저 연결이 끊긴다.
 */
const isPageClosed = (page: Page): boolean => page.isClosed() || !page.browser().connected;

/**
 * 상품 목록 조회, 로그인, 가격 수정 순회까지 처리하는 startUpdate 핸들러를 만든다.
 * 진행 상태는 응답이 아니라 updateState 채널로 요청한 창에 보낸다.
 * 핸들러를 여러 번 호출해도 page와 isUpdateRunning을 공유하도록 두 값을 이 함수의 클로저에 보관한다.
 * TODO: 목록 조회·로그인 실패를 renderer에 알리는 방법을 추가한다.
 * TODO: browser를 닫을 수 있도록 browser와 page를 하나로 묶어 보관하고, 종료 시 browser.close()를 호출한다.
 */
const createStartUpdate = (): ((sender: WebContents) => Promise<void>) => {
  // startUpdate를 다시 호출해도 다시 로그인하지 않도록 로그인한 페이지를 보관한다.
  let page: Page | null = null;
  // 순회가 도는 중에 startUpdate가 다시 들어오면 같은 page로 순회가 두 개 돌지 않도록 막는다.
  let isUpdateRunning = false;

  return async (sender) => {
    if (isUpdateRunning) {
      return;
    }

    isUpdateRunning = true;

    try {
      const myStoreName = validateEnv('SMART_STORE_NAME');
      const { targetProducts, invalidProductRows } = await fetchTargetProducts();

      // 수정할 상품이 없으면 로그인하지 않고, 빈 목록과 변환에 실패한 시트 행으로 끝난 상태만 보낸다.
      if (targetProducts.length === 0) {
        sendState(sender, {
          targetProducts: [],
          invalidProductRows,
          currentIndex: null,
          isRunning: false,
        });

        return;
      }

      // 이미 로그인한 페이지가 있으면 다시 로그인하지 않고 재사용한다. 사용자가 닫았다면 새로 열어 로그인한다.
      if (!page || isPageClosed(page)) {
        page = (await createPage()).page;

        await loginNaver(page);
      }

      sendState(sender, initState(targetProducts, invalidProductRows));

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

        // 화면에는 가장 바깥 에러의 메시지만 보내고, cause로 감싼 원인 에러는 위의 로그로만 남긴다.
        sendState(
          sender,
          setUpdate(
            index,
            error ? { status: 'error', message: error.message, time: Date.now() } : update,
          ),
        );

        // 다음 상품도 실패할 치명적 실패거나, 사용자가 브라우저를 닫았으면 순회를 멈춘다.
        if (error instanceof UnexpectedCatalogPageError || isPageClosed(page)) {
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
  };
};

export default createStartUpdate;
