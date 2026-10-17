import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerIpcHandlers } from './registerIpcHandlers';

const mockHandle = vi.fn();
const mockCreatePage = vi.fn();
const mockLoginNaver = vi.fn();
const mockGetSaleProducts = vi.fn();
const mockGetProductRows = vi.fn();
const mockExcludeNewlyRegisteredProducts = vi.fn();
const mockInitRawProductRows = vi.fn();
const mockFindDuplicateProductNames = vi.fn();
const mockCreateTargetProducts = vi.fn();
const mockShuffleArray = vi.fn();
const mockValidateEnv = vi.fn();
const mockUpdateTargetProducts = vi.fn();
const mockSend = vi.fn();

vi.mock('electron', () => ({
  ipcMain: { handle: (...args: unknown[]) => mockHandle(...args) },
}));

vi.mock(import('../integrations/puppeteer/createPage'), () => ({
  default: (...args: unknown[]) => mockCreatePage(...args),
}));

vi.mock(import('../integrations/puppeteer/loginNaver'), () => ({
  default: (...args: unknown[]) => mockLoginNaver(...args),
}));

vi.mock(import('../integrations/smartStore/getSaleProducts'), () => ({
  default: (...args: unknown[]) => mockGetSaleProducts(...args),
}));

vi.mock(import('../integrations/googleSheets/getProductRows'), () => ({
  default: (...args: unknown[]) => mockGetProductRows(...args),
}));

vi.mock(import('../domain/product/saleProduct'), () => ({
  excludeNewlyRegisteredProducts: (...args: unknown[]) =>
    mockExcludeNewlyRegisteredProducts(...args),
}));

vi.mock(import('../domain/product/initRawProductRows'), () => ({
  initRawProductRows: (...args: unknown[]) => mockInitRawProductRows(...args),
}));

vi.mock(import('../domain/product/findDuplicateProductNames'), () => ({
  findDuplicateProductNames: (...args: unknown[]) => mockFindDuplicateProductNames(...args),
}));

vi.mock(import('../domain/product/createTargetProducts'), () => ({
  createTargetProducts: (...args: unknown[]) => mockCreateTargetProducts(...args),
}));

vi.mock(import('../utils/shuffleArray'), () => ({
  default: (...args: unknown[]) => mockShuffleArray(...args),
}));

vi.mock(import('../utils/validateEnv'), () => ({
  default: (...args: unknown[]) => mockValidateEnv(...args),
}));

vi.mock(import('./updateTargetProducts'), () => ({
  default: (...args: unknown[]) => mockUpdateTargetProducts(...args),
}));

/**
 * registerIpcHandlers()를 한 번만 실행해 채널을 등록시킨 뒤, ipcMain.handle에 등록된 콜백 중
 * 해당 채널의 콜백을 찾아 직접 호출하는 함수를 반환한다.
 * IpcMainInvokeEvent는 handler에 전달되지 않으므로 빈 객체로 대체한다.
 *
 * page 변수는 registerIpcHandlers() 호출마다 새로 만들어져 같은 호출에서 등록된 핸들러끼리만 공유된다.
 * 그래서 createLoginPage로 채운 page를 startUpdate가 읽는 것처럼 핸들러 간 공유 상태를 검증하려면
 * registerIpcHandlers()가 한 번만 호출된 상태에서 여러 채널을 호출해야 하고, 이때 이 함수를 쓴다.
 *
 * startUpdate는 event.sender.send로 updateState를 push하므로, sender.send를 mockSend로 연결해 둔다.
 */
const createInvoker = (): ((channel: string, ...args: unknown[]) => unknown) => {
  registerIpcHandlers();

  return (channel, ...args) => {
    const call = mockHandle.mock.calls.find(([registeredChannel]) => registeredChannel === channel);

    if (!call) {
      throw new Error(`${channel} 채널이 등록되지 않았습니다.`);
    }

    const [, callback] = call;

    return callback({ sender: { send: mockSend } }, ...args);
  };
};

const invokeHandler = (channel: string, ...args: unknown[]): unknown =>
  createInvoker()(channel, ...args);

describe('registerIpcHandlers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mockHandle.mockReset();
    mockCreatePage.mockReset();
    mockLoginNaver.mockReset();
    mockGetSaleProducts.mockReset();
    mockGetProductRows.mockReset();
    mockExcludeNewlyRegisteredProducts.mockReset();
    mockInitRawProductRows.mockReset();
    mockFindDuplicateProductNames.mockReset();
    mockCreateTargetProducts.mockReset();
    mockShuffleArray.mockReset();
    mockValidateEnv.mockReset();
    mockUpdateTargetProducts.mockReset();
    mockSend.mockReset();
  });

  it('createLoginPage 채널을 호출하면 페이지를 생성하고 네이버에 로그인한다', async () => {
    const page = { name: 'fake-page' };
    mockCreatePage.mockResolvedValue({ browser: { name: 'fake-browser' }, page });

    await invokeHandler('createLoginPage');

    expect(mockCreatePage).toHaveBeenCalled();
    expect(mockLoginNaver).toHaveBeenCalledWith(page);
  });

  it('getTargetProducts 성공 시 판매 상품과 시트 행을 가공해 합친 목록과 중복 이름을 isSuccess: true로 반환한다', async () => {
    const rawSaleProducts = [{ id: 'raw' }];
    const filteredSaleProducts = [{ id: 'filtered' }];
    const shuffledSaleProducts = [{ id: 'shuffled' }];
    const rawProductRows = [['상품A']];
    const productRows = [{ name: '상품A' }];
    const targetProducts = [{ name: '상품A', originProductNo: 111 }];
    const duplicateProductNames = ['상품A'];

    mockGetSaleProducts.mockResolvedValue(rawSaleProducts);
    mockExcludeNewlyRegisteredProducts.mockReturnValue(filteredSaleProducts);
    mockShuffleArray.mockReturnValue(shuffledSaleProducts);
    mockGetProductRows.mockResolvedValue(rawProductRows);
    mockInitRawProductRows.mockReturnValue(productRows);
    mockFindDuplicateProductNames.mockReturnValue(duplicateProductNames);
    mockCreateTargetProducts.mockReturnValue(targetProducts);

    const result = await invokeHandler('getTargetProducts');

    expect(mockExcludeNewlyRegisteredProducts).toHaveBeenCalledWith(rawSaleProducts);
    expect(mockShuffleArray).toHaveBeenCalledWith(filteredSaleProducts);
    expect(mockInitRawProductRows).toHaveBeenCalledWith(rawProductRows);
    expect(mockFindDuplicateProductNames).toHaveBeenCalledWith(productRows);
    expect(mockCreateTargetProducts).toHaveBeenCalledWith(shuffledSaleProducts, productRows);
    expect(result).toEqual({ isSuccess: true, targetProducts, duplicateProductNames });
  });

  it('getTargetProducts는 판매 상품과 시트 행을 동시에 요청한다', () => {
    /**
     * 두 조회를 영원히 끝나지 않는 Promise로 만든 뒤 핸들러를 실행한다.
     * 동시에 요청(Promise.all)하면 한쪽이 끝나지 않아도 두 함수가 모두 호출된다.
     * 순서대로 요청(await를 두 번 나눠 씀)하면 앞의 조회에서 멈춰 뒤의 함수는 호출되지 않는다.
     * 핸들러의 결과는 기다리지 않으므로 void로 호출한다.
     */
    mockGetSaleProducts.mockReturnValue(new Promise(() => {}));
    mockGetProductRows.mockReturnValue(new Promise(() => {}));

    void invokeHandler('getTargetProducts');

    expect(mockGetSaleProducts).toHaveBeenCalled();
    expect(mockGetProductRows).toHaveBeenCalled();
  });

  it('getTargetProducts에서 getSaleProducts가 예외를 던지면 콘솔에 로깅하고 isSuccess: false와 에러 메시지를 반환한다', async () => {
    const error = new Error('네이버 판매 상품 목록을 가져오지 못했습니다.');
    mockGetSaleProducts.mockRejectedValue(error);
    mockGetProductRows.mockResolvedValue([]);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await invokeHandler('getTargetProducts');

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(result).toEqual({ isSuccess: false, error: error.message });

    consoleErrorSpy.mockRestore();
  });

  it('getTargetProducts에서 getProductRows가 예외를 던지면 콘솔에 로깅하고 isSuccess: false와 에러 메시지를 반환한다', async () => {
    const error = new Error('Google Sheets에서 상품 목록을 가져오지 못했습니다.');
    mockGetSaleProducts.mockResolvedValue([]);
    mockGetProductRows.mockRejectedValue(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await invokeHandler('getTargetProducts');

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(result).toEqual({ isSuccess: false, error: error.message });

    consoleErrorSpy.mockRestore();
  });

  it('getTargetProducts에서 Error가 아닌 값을 던지면 문자열로 변환해 반환한다', async () => {
    mockGetSaleProducts.mockRejectedValue('알 수 없는 문제');
    mockGetProductRows.mockResolvedValue([]);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await invokeHandler('getTargetProducts');

    expect(result).toEqual({
      isSuccess: false,
      error: 'getTargetProducts 에러: 알 수 없는 문제',
    });

    consoleErrorSpy.mockRestore();
  });

  it('startUpdate는 createLoginPage로 만든 페이지와 SMART_STORE_NAME으로 순회를 시작하고, 상태가 바뀔 때마다 updateState를 push한다', async () => {
    const page = { name: 'fake-page' };
    const targetProducts = [{ name: '상품A', originProductNo: 1 }];
    const state = { targetProducts: [], currentIndex: null, isRunning: true };
    mockCreatePage.mockResolvedValue({ browser: {}, page });
    mockValidateEnv.mockReturnValue('내 스토어');
    mockUpdateTargetProducts.mockImplementation(
      async (_page, _targetProducts, _myStoreName, emit) => {
        emit(state);
      },
    );

    const invoke = createInvoker();
    await invoke('createLoginPage');
    await invoke('startUpdate', targetProducts);

    expect(mockValidateEnv).toHaveBeenCalledWith('SMART_STORE_NAME');
    expect(mockUpdateTargetProducts).toHaveBeenCalledWith(
      page,
      targetProducts,
      '내 스토어',
      expect.any(Function),
    );
    expect(mockSend).toHaveBeenCalledWith('updateState', state);
  });

  it('startUpdate는 로그인 페이지가 없으면 콘솔에 로깅하고 순회를 시작하지 않는다', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await invokeHandler('startUpdate', [{ name: '상품A' }]);

    expect(mockUpdateTargetProducts).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('startUpdate에서 SMART_STORE_NAME 환경 변수가 없으면 콘솔에 로깅하고 순회를 시작하지 않는다', async () => {
    const error = new Error('환경 변수 SMART_STORE_NAME가 설정되지 않았습니다.');
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });
    mockValidateEnv.mockImplementation(() => {
      throw error;
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const invoke = createInvoker();
    await invoke('createLoginPage');
    await invoke('startUpdate', [{ name: '상품A' }]);

    expect(mockUpdateTargetProducts).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);

    consoleErrorSpy.mockRestore();
  });
});
