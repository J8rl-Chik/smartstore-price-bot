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
 * IpcMainInvokeEvent는 handler에 sender만 전달되므로 send만 가진 가짜 sender를 담은 객체로 대체한다.
 *
 * page 변수는 registerIpcHandlers() 호출마다 새로 만들어져 같은 호출에서 등록된 핸들러끼리만 공유된다.
 * 그래서 첫 startUpdate에서 로그인한 page를 다음 startUpdate가 재사용하는 것처럼 호출 간 공유 상태를 검증하려면
 * registerIpcHandlers()가 한 번만 호출된 상태에서 여러 번 호출해야 하고, 이때 이 함수를 쓴다.
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

  // startUpdate가 조회할 가격 수정 대상 목록을 정한다. 목록 생성 과정의 중간값은 이 테스트들의 관심사가 아니다.
  const mockFetchedTargetProducts = (targetProducts: unknown[]): void => {
    mockGetSaleProducts.mockResolvedValue([]);
    mockGetProductRows.mockResolvedValue([]);
    mockExcludeNewlyRegisteredProducts.mockReturnValue([]);
    mockShuffleArray.mockReturnValue([]);
    mockInitRawProductRows.mockReturnValue([]);
    mockFindDuplicateProductNames.mockReturnValue([]);
    mockCreateTargetProducts.mockReturnValue(targetProducts);
  };

  it('startUpdate는 판매 상품과 시트 행을 가공해 합친 목록으로 updateTargetProducts를 실행한다', async () => {
    const rawSaleProducts = [{ id: 'raw' }];
    const filteredSaleProducts = [{ id: 'filtered' }];
    const shuffledSaleProducts = [{ id: 'shuffled' }];
    const rawProductRows = [['상품A']];
    const productRows = [{ name: '상품A' }];
    const targetProducts = [{ name: '상품A', originProductNo: 111 }];

    mockGetSaleProducts.mockResolvedValue(rawSaleProducts);
    mockExcludeNewlyRegisteredProducts.mockReturnValue(filteredSaleProducts);
    mockShuffleArray.mockReturnValue(shuffledSaleProducts);
    mockGetProductRows.mockResolvedValue(rawProductRows);
    mockInitRawProductRows.mockReturnValue(productRows);
    mockCreateTargetProducts.mockReturnValue(targetProducts);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });

    await invokeHandler('startUpdate');

    expect(mockExcludeNewlyRegisteredProducts).toHaveBeenCalledWith(rawSaleProducts);
    expect(mockShuffleArray).toHaveBeenCalledWith(filteredSaleProducts);
    expect(mockInitRawProductRows).toHaveBeenCalledWith(rawProductRows);
    expect(mockCreateTargetProducts).toHaveBeenCalledWith(shuffledSaleProducts, productRows);
    expect(mockUpdateTargetProducts).toHaveBeenCalledWith(
      expect.anything(),
      targetProducts,
      undefined,
      expect.any(Function),
    );
  });

  it('startUpdate는 판매 상품과 시트 행을 동시에 요청한다', () => {
    /**
     * 두 조회를 영원히 끝나지 않는 Promise로 만든 뒤 핸들러를 실행한다.
     * 동시에 요청(Promise.all)하면 한쪽이 끝나지 않아도 두 함수가 모두 호출된다.
     * 순서대로 요청(await를 두 번 나눠 씀)하면 앞의 조회에서 멈춰 뒤의 함수는 호출되지 않는다.
     * 핸들러의 결과는 기다리지 않으므로 void로 호출한다.
     */
    mockGetSaleProducts.mockReturnValue(new Promise(() => {}));
    mockGetProductRows.mockReturnValue(new Promise(() => {}));

    void invokeHandler('startUpdate');

    expect(mockGetSaleProducts).toHaveBeenCalled();
    expect(mockGetProductRows).toHaveBeenCalled();
  });

  it('startUpdate는 조회한 상품 목록과 로그인한 페이지, 내 스토어 이름으로 updateTargetProducts를 실행한다', async () => {
    const page = { name: 'fake-page' };
    const targetProducts = [{ name: '상품A', originProductNo: 111 }];
    mockFetchedTargetProducts(targetProducts);
    mockValidateEnv.mockReturnValue('내 스토어');
    mockCreatePage.mockResolvedValue({ browser: {}, page });

    await invokeHandler('startUpdate');

    expect(mockValidateEnv).toHaveBeenCalledWith('SMART_STORE_NAME');
    expect(mockLoginNaver).toHaveBeenCalledWith(page);
    expect(mockUpdateTargetProducts).toHaveBeenCalledWith(
      page,
      targetProducts,
      '내 스토어',
      expect.any(Function),
    );
  });

  it('startUpdate는 updateTargetProducts가 emit한 상태를 요청한 창의 updateState 채널로 보낸다', async () => {
    const state = { targetProducts: [], currentIndex: 0, isRunning: true };

    mockFetchedTargetProducts([{ name: '상품A', originProductNo: 111 }]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });
    mockUpdateTargetProducts.mockImplementation(
      async (_page, _targetProducts, _myStoreName, emit) => emit(state),
    );

    await invokeHandler('startUpdate');

    expect(mockSend).toHaveBeenCalledWith('updateState', state);
  });

  it('startUpdate는 다시 호출되면 다시 로그인하지 않고 이전에 로그인한 페이지를 쓴다', async () => {
    const page = { name: 'fake-page' };
    mockFetchedTargetProducts([{ name: '상품A', originProductNo: 111 }]);
    mockCreatePage.mockResolvedValue({ browser: {}, page });

    const invoke = createInvoker();
    await invoke('startUpdate');
    await invoke('startUpdate');

    expect(mockCreatePage).toHaveBeenCalledTimes(1);
    expect(mockLoginNaver).toHaveBeenCalledTimes(1);
    expect(mockUpdateTargetProducts).toHaveBeenNthCalledWith(
      2,
      page,
      expect.any(Array),
      undefined,
      expect.any(Function),
    );
  });

  it('startUpdate는 수정할 상품이 없으면 로그인과 순회를 하지 않고 빈 목록으로 끝난 상태를 보낸다', async () => {
    mockFetchedTargetProducts([]);

    await invokeHandler('startUpdate');

    expect(mockCreatePage).not.toHaveBeenCalled();
    expect(mockUpdateTargetProducts).not.toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledWith('updateState', {
      targetProducts: [],
      currentIndex: null,
      isRunning: false,
    });
  });

  it('startUpdate는 순회가 도는 중에 다시 호출되면 새 순회를 시작하지 않는다', async () => {
    mockFetchedTargetProducts([{ name: '상품A', originProductNo: 111 }]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });
    mockUpdateTargetProducts.mockReturnValue(new Promise(() => {}));

    const invoke = createInvoker();
    void invoke('startUpdate');
    await vi.waitFor(() => expect(mockUpdateTargetProducts).toHaveBeenCalled());
    await invoke('startUpdate');

    expect(mockUpdateTargetProducts).toHaveBeenCalledTimes(1);
  });

  it('startUpdate는 순회가 끝나면 다시 호출했을 때 새 순회를 시작한다', async () => {
    mockFetchedTargetProducts([{ name: '상품A', originProductNo: 111 }]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });
    mockUpdateTargetProducts.mockResolvedValue(undefined);

    const invoke = createInvoker();
    await invoke('startUpdate');
    await invoke('startUpdate');

    expect(mockUpdateTargetProducts).toHaveBeenCalledTimes(2);
  });

  it('startUpdate는 처리 중 예외가 발생하면 콘솔에 로깅하고, 다시 호출했을 때 새로 시작한다', async () => {
    const error = new Error('네이버 판매 상품 목록을 가져오지 못했습니다.');
    mockFetchedTargetProducts([{ name: '상품A', originProductNo: 111 }]);
    mockGetSaleProducts.mockRejectedValueOnce(error);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const invoke = createInvoker();
    await invoke('startUpdate');
    await invoke('startUpdate');

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(mockUpdateTargetProducts).toHaveBeenCalledTimes(1);

    consoleErrorSpy.mockRestore();
  });
});
