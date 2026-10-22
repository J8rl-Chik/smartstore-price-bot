import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerIpcHandlers } from './registerIpcHandlers';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import type { UpdateState } from '../domain/product/_type';

const mockHandle = vi.fn();
const mockCreatePage = vi.fn();
const mockLoginNaver = vi.fn();
const mockGetSaleProducts = vi.fn();
const mockGetProductRows = vi.fn();
const mockExcludeNewlyRegisteredProducts = vi.fn();
const mockParseProductRow = vi.fn();
const mockFindDuplicateProductNames = vi.fn();
const mockCreateTargetProducts = vi.fn();
const mockShuffleArray = vi.fn();
const mockValidateEnv = vi.fn();
const mockUpdateTargetProductPrice = vi.fn();
const mockDelaySeconds = vi.fn();
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

vi.mock(import('../domain/product/parseRawProductRow'), () => ({
  parseProductRow: (...args: unknown[]) => mockParseProductRow(...args),
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

vi.mock(import('../utils/delaySeconds'), () => ({
  default: (...args: unknown[]) => mockDelaySeconds(...args),
}));

vi.mock(import('./updateTargetProductPrice'), () => ({
  default: (...args: unknown[]) => mockUpdateTargetProductPrice(...args),
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
    vi.restoreAllMocks();
    mockHandle.mockReset();
    mockCreatePage.mockReset();
    mockLoginNaver.mockReset();
    mockGetSaleProducts.mockReset();
    mockGetProductRows.mockReset();
    mockExcludeNewlyRegisteredProducts.mockReset();
    mockParseProductRow.mockReset();
    mockFindDuplicateProductNames.mockReset();
    mockCreateTargetProducts.mockReset();
    mockShuffleArray.mockReset();
    mockValidateEnv.mockReset();
    mockUpdateTargetProductPrice.mockReset();
    mockDelaySeconds.mockReset();
    mockSend.mockReset();
  });

  // startUpdate가 조회할 가격 수정 대상 목록을 정한다. 목록 생성 과정의 중간값은 이 테스트들의 관심사가 아니다.
  const mockFetchedTargetProducts = (targetProducts: unknown[]): void => {
    mockGetSaleProducts.mockResolvedValue([]);
    mockGetProductRows.mockResolvedValue([]);
    mockExcludeNewlyRegisteredProducts.mockReturnValue([]);
    mockShuffleArray.mockReturnValue([]);
    mockFindDuplicateProductNames.mockReturnValue([]);
    mockCreateTargetProducts.mockReturnValue(targetProducts);
  };

  it('startUpdate는 판매 상품과 시트 행을 가공해 합친 목록의 상품으로 가격 수정을 처리한다', async () => {
    const rawSaleProducts = [{ id: 'raw' }];
    const filteredSaleProducts = [{ id: 'filtered' }];
    const shuffledSaleProducts = [{ id: 'shuffled' }];
    const rawProductRows = [['상품A'], ['상품B']];
    const productRow = { name: '상품A' };
    const targetProduct = { name: '상품A', originProductNo: 111 };

    mockGetSaleProducts.mockResolvedValue(rawSaleProducts);
    mockExcludeNewlyRegisteredProducts.mockReturnValue(filteredSaleProducts);
    mockShuffleArray.mockReturnValue(shuffledSaleProducts);
    mockGetProductRows.mockResolvedValue(rawProductRows);
    mockParseProductRow.mockReturnValueOnce({ status: 'ok', productRow }).mockReturnValueOnce({
      status: 'error',
      productRow: { name: '상품B' },
      errorMessages: ['productPrice: 에러'],
    });
    mockCreateTargetProducts.mockReturnValue([targetProduct]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });

    await invokeHandler('startUpdate');

    expect(mockExcludeNewlyRegisteredProducts).toHaveBeenCalledWith(rawSaleProducts);
    expect(mockShuffleArray).toHaveBeenCalledWith(filteredSaleProducts);
    // map이 넘기는 인덱스·배열 인자는 관심사가 아니라 첫 번째 인자(행)만 비교한다.
    expect(mockParseProductRow.mock.calls.map(([rowValues]) => rowValues)).toEqual(rawProductRows);
    // 변환에 실패한 행(상품B)은 빼고 성공한 행만 넘긴다.
    expect(mockFindDuplicateProductNames).toHaveBeenCalledWith([productRow]);
    expect(mockCreateTargetProducts).toHaveBeenCalledWith(shuffledSaleProducts, [productRow]);
    expect(mockUpdateTargetProductPrice).toHaveBeenCalledWith(
      expect.anything(),
      targetProduct,
      undefined,
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

  const productA = { name: '상품A', originProductNo: 111 };
  const productB = { name: '상품B', originProductNo: 222 };

  it('startUpdate는 상품마다 로그인한 페이지, 상품, 내 스토어 이름으로 가격 수정을 처리한다', async () => {
    const page = { name: 'fake-page' };
    mockFetchedTargetProducts([productA, productB]);
    mockValidateEnv.mockReturnValue('내 스토어');
    mockCreatePage.mockResolvedValue({ browser: {}, page });

    await invokeHandler('startUpdate');

    expect(mockValidateEnv).toHaveBeenCalledWith('SMART_STORE_NAME');
    expect(mockLoginNaver).toHaveBeenCalledWith(page);
    expect(mockUpdateTargetProductPrice).toHaveBeenNthCalledWith(1, page, productA, '내 스토어');
    expect(mockUpdateTargetProductPrice).toHaveBeenNthCalledWith(2, page, productB, '내 스토어');
  });

  it('startUpdate는 다시 호출되면 다시 로그인하지 않고 이전에 로그인한 페이지를 쓴다', async () => {
    const page = { name: 'fake-page' };
    mockFetchedTargetProducts([productA]);
    mockCreatePage.mockResolvedValue({ browser: {}, page });

    const invoke = createInvoker();
    await invoke('startUpdate');
    await invoke('startUpdate');

    expect(mockCreatePage).toHaveBeenCalledTimes(1);
    expect(mockLoginNaver).toHaveBeenCalledTimes(1);
    expect(mockUpdateTargetProductPrice).toHaveBeenNthCalledWith(2, page, productA, undefined);
  });

  it('startUpdate는 수정할 상품이 없으면 로그인과 순회를 하지 않고 빈 목록으로 끝난 상태를 보낸다', async () => {
    mockFetchedTargetProducts([]);

    await invokeHandler('startUpdate');

    expect(mockCreatePage).not.toHaveBeenCalled();
    expect(mockUpdateTargetProductPrice).not.toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledWith('updateState', {
      targetProducts: [],
      currentIndex: null,
      isRunning: false,
    });
  });

  it('startUpdate는 순회가 도는 중에 다시 호출되면 새 순회를 시작하지 않는다', async () => {
    mockFetchedTargetProducts([productA]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });
    mockUpdateTargetProductPrice.mockReturnValue(new Promise(() => {}));

    const invoke = createInvoker();
    void invoke('startUpdate');
    await vi.waitFor(() => expect(mockUpdateTargetProductPrice).toHaveBeenCalled());
    await invoke('startUpdate');

    expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
  });

  it('startUpdate는 순회가 끝나면 다시 호출했을 때 새 순회를 시작한다', async () => {
    mockFetchedTargetProducts([productA]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });

    const invoke = createInvoker();
    await invoke('startUpdate');
    await invoke('startUpdate');

    expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(2);
  });

  it('startUpdate는 처리 중 예외가 발생하면 콘솔에 로깅하고, 다시 호출했을 때 새로 시작한다', async () => {
    const error = new Error('네이버 판매 상품 목록을 가져오지 못했습니다.');
    mockFetchedTargetProducts([productA]);
    mockGetSaleProducts.mockRejectedValueOnce(error);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const invoke = createInvoker();
    await invoke('startUpdate');
    await invoke('startUpdate');

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
  });

  // 순회 테스트에서 상품 목록 조회와 로그인까지 마친 상태로 만든다.
  const mockLoggedInWith = (targetProducts: unknown[]): void => {
    mockFetchedTargetProducts(targetProducts);
    mockCreatePage.mockResolvedValue({ browser: {}, page: { name: 'fake-page' } });
  };

  it('startUpdate는 순회를 시작하면 상품 전체가 wait 상태이고 isRunning이 true인 상태를 먼저 보낸다', async () => {
    mockLoggedInWith([productA, productB]);

    await invokeHandler('startUpdate');

    expect(mockSend).toHaveBeenNthCalledWith(1, 'updateState', {
      targetProducts: [
        { ...productA, update: { status: 'wait' } },
        { ...productB, update: { status: 'wait' } },
      ],
      currentIndex: null,
      isRunning: true,
    });
  });

  const getSentStates = (): UpdateState[] => mockSend.mock.calls.map(([, state]) => state);

  it('startUpdate는 상품을 처리하기 전에 currentIndex를 그 상품의 인덱스로 바꾼 상태를 보낸다', async () => {
    mockLoggedInWith([productA, productB]);

    await invokeHandler('startUpdate');

    const currentIndexes = getSentStates().map(({ currentIndex }) => currentIndex);

    expect(currentIndexes).toEqual([null, 0, 0, 1, 1, null]);
  });

  const updateTime = 1700000000000;
  const completeUpdate = { status: 'complete', price: 39990, baseFee: 3000, time: updateTime };

  const getLastSentState = (): UpdateState => getSentStates().at(-1) as UpdateState;

  it('startUpdate는 가격 수정에 성공하면 그 상품만 반환된 수정 결과를 반영한 상태를 보낸다', async () => {
    mockLoggedInWith([productA, productB]);
    mockUpdateTargetProductPrice.mockResolvedValue(completeUpdate);
    mockDelaySeconds.mockReturnValueOnce(new Promise(() => {}));

    void invokeHandler('startUpdate');
    await vi.waitFor(() => expect(mockDelaySeconds).toHaveBeenCalled());

    expect(getLastSentState().targetProducts).toEqual([
      { ...productA, update: completeUpdate },
      { ...productB, update: { status: 'wait' } },
    ]);
  });

  it('startUpdate는 상품 하나에서 에러가 나면 콘솔에 로깅하고 그 상품만 error로 반영한 뒤 다음 상품을 처리한다', async () => {
    const error = new Error('가격 수정 실패');
    mockLoggedInWith([productA, productB]);
    mockUpdateTargetProductPrice.mockRejectedValueOnce(error).mockResolvedValueOnce(completeUpdate);
    vi.spyOn(Date, 'now').mockReturnValue(updateTime);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await invokeHandler('startUpdate');

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(getLastSentState().targetProducts).toEqual([
      { ...productA, update: { status: 'error', time: updateTime } },
      { ...productB, update: completeUpdate },
    ]);
  });

  it('startUpdate는 UnexpectedCatalogPageError가 나면 그 상품을 error로 반영하고 다음 상품은 처리하지 않는다', async () => {
    mockLoggedInWith([productA, productB]);
    mockUpdateTargetProductPrice.mockRejectedValueOnce(
      new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.'),
    );
    vi.spyOn(Date, 'now').mockReturnValue(updateTime);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await invokeHandler('startUpdate');

    expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
    expect(getLastSentState().targetProducts).toEqual([
      { ...productA, update: { status: 'error', time: updateTime } },
      { ...productB, update: { status: 'wait' } },
    ]);
  });

  it('startUpdate는 상품을 처리할 때마다 5초 대기한다', async () => {
    mockLoggedInWith([productA, productB]);

    await invokeHandler('startUpdate');

    expect(mockDelaySeconds).toHaveBeenCalledTimes(2);
    expect(mockDelaySeconds).toHaveBeenCalledWith(5);
  });

  it('startUpdate는 순회가 끝나면 currentIndex를 null로, isRunning을 false로 바꾼 상태를 보낸다', async () => {
    mockLoggedInWith([productA]);

    await invokeHandler('startUpdate');

    expect(getLastSentState()).toMatchObject({ currentIndex: null, isRunning: false });
  });

  it('startUpdate는 치명적 실패로 중단해도 currentIndex를 null로, isRunning을 false로 바꾼 상태를 보낸다', async () => {
    mockLoggedInWith([productA, productB]);
    mockUpdateTargetProductPrice.mockRejectedValueOnce(
      new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.'),
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await invokeHandler('startUpdate');

    expect(getLastSentState()).toMatchObject({ currentIndex: null, isRunning: false });
  });
});
