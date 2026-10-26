import type { WebContents } from 'electron';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import validateEnv from '../utils/validateEnv';
import delaySeconds from '../utils/delaySeconds';
import tryCatch from '../utils/tryCatch';
import fetchTargetProducts from './fetchTargetProducts';
import updateTargetProductPrice from './updateTargetProductPrice';
import { createStateSender } from './state';
import { getLoggedInPage, isPageClosed } from './browserSession';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';
import type { StartUpdateResult } from '../preload/_type';
/**
 * 상품 목록 조회, 로그인, 가격 수정 순회까지 처리하는 startUpdate 핸들러를 만든다.
 * 진행 상태는 응답이 아니라 updateState 채널로 요청한 창에 보내고, 응답으로는 처리 결과만 돌려준다.
 * 목록 조회·로그인 실패는 throw하지 않고 error 결과로 돌려준다. throw하면 Electron이 메시지 앞에 접두어를 붙여 보내기 때문이다.
 * 핸들러를 여러 번 호출해도 isUpdateRunning을 공유하도록 이 함수의 클로저에 보관한다.
 */
const createStartUpdate = (): ((sender: WebContents) => Promise<StartUpdateResult>) => {
  // 순회가 도는 중에 startUpdate가 다시 들어오면 같은 page로 순회가 두 개 돌지 않도록 막는다.
  let isUpdateRunning = false;

  return async (sender) => {
    if (isUpdateRunning) {
      return { status: 'running' };
    }

    isUpdateRunning = true;
    // 상태는 순회마다 빈 초기 상태에서 시작하고, 이 순회를 시작한 창에만 보낸다.
    const { sendState, sendUpdate } = createStateSender(sender);
    // 목록 조회·로그인은 오래 걸릴 수 있어, 시작하자마자 준비 중인 상태부터 보낸다.
    sendState({ isPreparing: true });

    try {
      const myStoreName = validateEnv('SMART_STORE_NAME');
      const { targetProducts, invalidProductRows } = await fetchTargetProducts();

      // 수정할 상품이 없으면 로그인하지 않고, 빈 목록과 변환에 실패한 시트 행으로 끝난 상태만 보낸다.
      if (targetProducts.length === 0) {
        sendState({
          targetProducts: [],
          invalidProductRows,
          currentIndex: null,
          isPreparing: false,
          isRunning: false,
        });

        return { status: 'done' };
      }

      const page = await getLoggedInPage();

      // 상품 전체를 wait로 두고, 아직 처리 중인 상품은 없는 순회 시작 상태를 보낸다.
      sendState({
        targetProducts: targetProducts.map((targetProduct) => ({
          ...targetProduct,
          update: { status: 'wait' },
        })),
        invalidProductRows,
        currentIndex: null,
        isPreparing: false,
        isRunning: true,
      });

      /**
       * 상품 하나의 실패는 그 상품만 error로 반영하고 계속하며,
       * 네이버 쇼핑 접속 제한(UnexpectedCatalogPageError)처럼 다음 상품도 실패할 치명적 실패는 error로 반영한 뒤 중단한다.
       */
      for (const [index, targetProduct] of targetProducts.entries()) {
        sendState({ currentIndex: index });

        const [error, update] = await tryCatch(
          updateTargetProductPrice(page, targetProduct, myStoreName),
        );

        if (error) {
          console.error(error);
        }

        // 화면에는 가장 바깥 에러의 메시지만 보내고, cause로 감싼 원인 에러는 위의 로그로만 남긴다.
        sendUpdate(
          index,
          error ? { status: 'error', message: error.message, time: Date.now() } : update,
        );

        // 다음 상품도 실패할 치명적 실패거나, 사용자가 브라우저를 닫았으면 순회를 멈춘다.
        if (error instanceof UnexpectedCatalogPageError || isPageClosed(page)) {
          break;
        }

        await delaySeconds(5);
      }

      sendState({ currentIndex: null, isRunning: false });

      return { status: 'done' };
    } catch (error) {
      console.error(error);
      // 준비 중에 실패해도 화면이 준비 중 상태에 머물지 않도록 준비를 끝낸 상태를 보낸다.
      sendState({ isPreparing: false });

      return {
        status: 'error',
        message: error instanceof Error ? error.message : ERROR_MESSAGE.UNKNOWN_ERROR,
      };
    } finally {
      isUpdateRunning = false;
    }
  };
};

export default createStartUpdate;
