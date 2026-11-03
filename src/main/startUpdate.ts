import type { WebContents } from 'electron';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import validateEnv from '../utils/validateEnv';
import delaySeconds from '../utils/delaySeconds';
import tryCatch from '../utils/tryCatch';
import findErrorInCause from '../utils/findErrorInCause';
import fetchTargetProducts from './fetchTargetProducts';
import updateTargetProductPrice from './updateTargetProductPrice';
import { createStateSender } from './state';
import { closeBrowser, getLoggedInPage, isPageClosed } from './browserSession';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';
import type { IpcInvoke } from '../preload/_type';
import type { UpdateScheduler } from './updateScheduler';

// ipcMain.handle에 등록하는 핸들러. 요청한 창(sender)은 renderer가 보낸 인자 뒤에 붙어 온다.
type StartUpdateHandler = (
  ...args: [...Parameters<IpcInvoke['startUpdate']>, WebContents]
) => ReturnType<IpcInvoke['startUpdate']>;

/**
 * 상품 목록 조회, 로그인, 가격 수정 순회를 처리하는 startUpdate 핸들러를 만든다.
 * 진행 상태와 실패 이유는 updateState 채널로 요청한 창에 보낸다.
 * 목록 조회·로그인 실패와 순회를 멈춘 치명적 실패는 throw하지 않고 errorMessage로 보낸다.
 * throw하면 Electron이 메시지 앞에 접두어를 붙여 보내기 때문이다.
 * 어떻게 끝나든 화면이 준비 중이나 순회 중 상태에 머물지 않도록 끝난 상태는 finally에서 한 번에 보낸다.
 * 브라우저도 finally에서 닫는다. 로그인 쿠키는 userDataDir에 남아 다음 순회에서 로그인 폼을 다시 입력하지 않는다.
 * 순회 중 여부와 예약한 재실행은 stopUpdate와 공유하는 scheduler에 맡긴다.
 */
const createStartUpdate = (scheduler: UpdateScheduler): StartUpdateHandler => {
  const startUpdate: StartUpdateHandler = async (restartDelayMinutes, sender) => {
    // 순회 중이거나 재실행을 기다리는 중이면 새로 시작하지 않는다.
    if (scheduler.isUpdateBlocked()) {
      return;
    }

    scheduler.lockUpdate();

    // 상태는 순회마다 빈 초기 상태에서 시작하고, 이 순회를 시작한 창에만 보낸다.
    const { sendState, sendUpdate } = createStateSender(sender);
    // 목록 조회·로그인은 오래 걸릴 수 있어, 시작하자마자 준비 중인 상태부터 보낸다.
    sendState({ isPreparing: true });

    /**
     * renderer가 요청하지 않은 순회(자동 재실행)의 실패도 화면에 띄울 수 있도록,
     * 실패 이유는 finally에서 끝난 상태와 함께 보낸다.
     */
    let errorMessage: string | null = null;

    try {
      const myStoreName = validateEnv('SMART_STORE_NAME');
      const { targetProducts, invalidProductRows } = await fetchTargetProducts();

      // 수정할 상품이 없으면 로그인하지 않고, 변환에 실패한 시트 행만 보낸 뒤 끝낸다.
      if (targetProducts.length === 0) {
        sendState({ invalidProductRows });

        return;
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
       * 네이버 쇼핑 접속 제한(UnexpectedCatalogPageError)처럼 다음 상품도 실패할 치명적 실패는
       * error로 반영한 뒤 던져서, 순회 전 실패처럼 catch에서 errorMessage로 정한다.
       */
      for (const [index, targetProduct] of targetProducts.entries()) {
        sendState({ currentIndex: index });

        const [error, update] = await tryCatch(
          updateTargetProductPrice(page, targetProduct, myStoreName),
        );

        if (error) {
          console.error(error);
        }

        // 중간 계층이 ERROR_MESSAGE로 감싸 던지므로, cause까지 따라가 치명적 실패인지 확인한다.
        const fatalError = findErrorInCause(error, UnexpectedCatalogPageError);

        /**
         * 화면에는 가장 바깥 에러의 메시지만 보내고, cause로 감싼 원인 에러는 위의 로그로만 남긴다.
         * 치명적 실패만 예외로 원인 에러의 메시지(접속 제한)를 보낸다. 바깥 메시지로는 다시 시도하면 된다는 걸 알 수 없기 때문이다.
         */
        sendUpdate(
          index,
          error
            ? { status: 'error', message: (fatalError ?? error).message, time: Date.now() }
            : update,
        );

        if (fatalError) {
          throw fatalError;
        }

        // 사용자가 브라우저를 닫은 건 실패가 아니므로 순회만 멈추고 끝낸다.
        if (isPageClosed(page)) {
          break;
        }

        await delaySeconds(5);
      }
    } catch (error) {
      console.error(error);

      errorMessage = error instanceof Error ? error.message : ERROR_MESSAGE.UNKNOWN_ERROR;
    } finally {
      // 다음 순회가 닫히는 중인 브라우저를 받지 않도록, 브라우저를 닫은 뒤에 잠금을 푼다.
      const [closeError] = await tryCatch(closeBrowser());

      if (closeError) {
        console.error(closeError);
      }

      // 끝난 상태를 보내다 창이 닫혀 실패해도 다음 순회가 막히지 않도록 상태보다 잠금부터 푼다.
      scheduler.unlockUpdate();
      sendState({ currentIndex: null, isPreparing: false, isRunning: false, errorMessage });

      /**
       * errorMessage가 null이면 순회를 끝냈거나, 수정할 상품이 없었거나, 사용자가 브라우저를 닫아 멈춘 것이다.
       * 실패로 끝나면 같은 실패가 반복될 수 있어 재실행하지 않는다.
       */
      if (errorMessage === null && restartDelayMinutes !== null) {
        const delayMilliseconds = restartDelayMinutes * 60 * 1000;

        scheduler.scheduleRestart(
          delayMilliseconds,
          () => {
            // 기다리는 동안 창이 닫혔으면 상태를 보낼 곳이 없으므로 다시 순회하지 않는다.
            if (sender.isDestroyed()) {
              return;
            }

            // 요청한 renderer가 없어 실패를 돌려받을 곳이 없으므로 로그로 남긴다.
            startUpdate(restartDelayMinutes, sender).catch((error) => console.error(error));
          },
          // 취소하면 예약을 건 순회의 상태에서 nextRunAt만 지워 보낸다.
          () => sendState({ nextRunAt: null }),
        );

        sendState({ nextRunAt: Date.now() + delayMilliseconds });
      }
    }
  };

  return startUpdate;
};

export default createStartUpdate;
