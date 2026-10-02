import { ipcMain } from 'electron';
import { IpcEvent } from '../preload/_type';
import createPage from '../integrations/puppeteer/createPage';
import loginNaver from '../integrations/puppeteer/loginNaver';
import getSaleProducts from '../integrations/smartStore/getSaleProducts';
import getProductRows from '../integrations/googleSheets/getProductRows';
import { excludeNewlyRegisteredProducts } from '../domain/product/saleProduct';
import { initRawProductRows } from '../domain/product/initRawProductRows';
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
  handleIpc('createLoginPage', async () => {
    const { page } = await createPage();

    await loginNaver(page);
  });

  handleIpc('getSaleProducts', async () => {
    try {
      const saleProducts = shuffleArray(excludeNewlyRegisteredProducts(await getSaleProducts()));

      return { isSuccess: true, saleProducts } as const;
    } catch (error) {
      console.error(error);

      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : String(`getSaleProducts 에러: ${error}`),
      } as const;
    }
  });

  handleIpc('getProductRows', async () => {
    try {
      // TODO: 중복 이름을 가진 행이 있는지 확인하는 로직 추가
      const productRows = initRawProductRows(await getProductRows());

      return { isSuccess: true, productRows } as const;
    } catch (error) {
      console.error(error);

      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : String(`getProductRows 에러: ${error}`),
      } as const;
    }
  });
};
