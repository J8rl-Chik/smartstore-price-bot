import { ipcMain } from 'electron';
import { IpcEvent } from '../preload/ipcEvent';
import createPage from '../integrations/puppeteer/createPage';
import getSaleProducts from '../integrations/smartStore/getSaleProducts';
import getProductRows from '../integrations/googleSheets/getProductRows';
import { excludeNewlyRegisteredProducts } from '../domain/product/saleProduct';
import { initRawProductRows } from '../domain/product/initRawProductRows';
import shuffleArray from '../utils/shuffleArray';

// 채널 이름(K)에 맞는 요청 인자와 응답 타입을 강제하는 ipcMain.handle 래퍼
const handleIpc = <E extends keyof IpcEvent>(
  event: E,
  handler: (
    ...args: IpcEvent[E]['args']
  ) => IpcEvent[E]['returnType'] | Promise<IpcEvent[E]['returnType']>,
): void => {
  // ipcMain.handle 콜백의 첫 번째 인자(IpcMainInvokeEvent)는 렌더러가 보낸 값이 아니므로 제외하고 나머지만 handler에 전달한다.
  ipcMain.handle(event, (_event, ...args) => handler(...(args as IpcEvent[E]['args'])));
};

export const registerIpcHandlers = (): void => {
  handleIpc('createPage', async () => {
    await createPage();
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
      };
    }
  });

  handleIpc('getProductRows', async () => {
    try {
      const productRows = initRawProductRows(await getProductRows());

      return { isSuccess: true, productRows } as const;
    } catch (error) {
      console.error(error);

      return {
        isSuccess: false,
        error: error instanceof Error ? error.message : String(`getProductRows 에러: ${error}`),
      };
    }
  });
};
