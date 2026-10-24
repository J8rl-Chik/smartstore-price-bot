import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerIpcHandlers } from './registerIpcHandlers';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import type { UpdateState } from '../domain/product/_type';

const mockHandle = vi.fn();
const mockCreatePage = vi.fn();
const mockLoginNaver = vi.fn();
const mockFetchTargetProducts = vi.fn();
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

vi.mock(import('./fetchTargetProducts'), () => ({
  default: (...args: unknown[]) => mockFetchTargetProducts(...args),
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
    mockFetchTargetProducts.mockReset();
    mockValidateEnv.mockReset();
    mockUpdateTargetProductPrice.mockReset();
    mockDelaySeconds.mockReset();
    mockSend.mockReset();
  });

  // startUpdate가 조회할 가격 수정 대상 목록과 변환에 실패한 시트 행을 정한다.
  const mockFetchedTargetProducts = (
    targetProducts: unknown[],
    invalidProductRows: unknown[] = [],
  ): void => {
    mockFetchTargetProducts.mockResolvedValue({
      targetProducts,
      duplicateProductNames: [],
      invalidProductRows,
    });
  };

  // 순회가 닫힘 여부를 확인하는 isClosed와 browser().connected만 가진 가짜 page를 만든다.
  const createFakePage = ({ isClosed = false, isConnected = true } = {}): unknown => ({
    isClosed: () => isClosed,
    browser: () => ({ connected: isConnected }),
  });

  const productA = { name: '상품A', originProductNo: 111 };
  const productB = { name: '상품B', originProductNo: 222 };

  it('startUpdate는 상품마다 로그인한 페이지, 상품, 내 스토어 이름으로 가격 수정을 처리한다', async () => {
    const page = createFakePage();
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
    const page = createFakePage();
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
      invalidProductRows: [],
      currentIndex: null,
      isRunning: false,
    });
  });

  const invalidProductRow = { name: '상품C', errorMessages: ['productPrice: 에러'] };

  it('startUpdate는 변환에 실패한 시트 행을 담아 순회 시작 상태로 보낸다', async () => {
    mockFetchedTargetProducts([productA], [invalidProductRow]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: createFakePage() });

    await invokeHandler('startUpdate');

    expect(mockSend).toHaveBeenNthCalledWith(
      1,
      'updateState',
      expect.objectContaining({ invalidProductRows: [invalidProductRow] }),
    );
  });

  it('startUpdate는 수정할 상품이 없어도 변환에 실패한 시트 행을 담아 끝난 상태를 보낸다', async () => {
    mockFetchedTargetProducts([], [invalidProductRow]);

    await invokeHandler('startUpdate');

    expect(mockSend).toHaveBeenCalledWith('updateState', {
      targetProducts: [],
      invalidProductRows: [invalidProductRow],
      currentIndex: null,
      isRunning: false,
    });
  });

  it('startUpdate는 순회가 도는 중에 다시 호출되면 새 순회를 시작하지 않는다', async () => {
    mockFetchedTargetProducts([productA]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: createFakePage() });
    mockUpdateTargetProductPrice.mockReturnValue(new Promise(() => {}));

    const invoke = createInvoker();
    void invoke('startUpdate');
    await vi.waitFor(() => expect(mockUpdateTargetProductPrice).toHaveBeenCalled());
    await invoke('startUpdate');

    expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
  });

  it('startUpdate는 순회가 끝나면 다시 호출했을 때 새 순회를 시작한다', async () => {
    mockFetchedTargetProducts([productA]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: createFakePage() });

    const invoke = createInvoker();
    await invoke('startUpdate');
    await invoke('startUpdate');

    expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(2);
  });

  it('startUpdate는 처리 중 예외가 발생하면 콘솔에 로깅하고, 다시 호출했을 때 새로 시작한다', async () => {
    const error = new Error('네이버 판매 상품 목록을 가져오지 못했습니다.');
    mockFetchedTargetProducts([productA]);
    mockFetchTargetProducts.mockRejectedValueOnce(error);
    mockCreatePage.mockResolvedValue({ browser: {}, page: createFakePage() });

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
    mockCreatePage.mockResolvedValue({ browser: {}, page: createFakePage() });
  };

  it('startUpdate는 순회를 시작하면 상품 전체가 wait 상태이고 isRunning이 true인 상태를 먼저 보낸다', async () => {
    mockLoggedInWith([productA, productB]);

    await invokeHandler('startUpdate');

    expect(mockSend).toHaveBeenNthCalledWith(1, 'updateState', {
      targetProducts: [
        { ...productA, update: { status: 'wait' } },
        { ...productB, update: { status: 'wait' } },
      ],
      invalidProductRows: [],
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

  it('startUpdate는 사용자가 브라우저 탭을 닫으면 다음 상품은 처리하지 않고 끝난 상태를 보낸다', async () => {
    mockFetchedTargetProducts([productA, productB]);
    mockCreatePage.mockResolvedValue({ browser: {}, page: createFakePage({ isClosed: true }) });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await invokeHandler('startUpdate');

    expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
    expect(getLastSentState()).toMatchObject({ currentIndex: null, isRunning: false });
  });

  it('startUpdate는 사용자가 브라우저 창을 닫았으면 다시 호출했을 때 새 페이지를 열어 로그인한다', async () => {
    const newPage = createFakePage();
    mockFetchedTargetProducts([productA]);
    mockCreatePage
      .mockResolvedValueOnce({ browser: {}, page: createFakePage({ isConnected: false }) })
      .mockResolvedValueOnce({ browser: {}, page: newPage });

    const invoke = createInvoker();
    await invoke('startUpdate');
    await invoke('startUpdate');

    expect(mockCreatePage).toHaveBeenCalledTimes(2);
    expect(mockLoginNaver).toHaveBeenNthCalledWith(2, newPage);
    expect(mockUpdateTargetProductPrice).toHaveBeenNthCalledWith(2, newPage, productA, undefined);
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
