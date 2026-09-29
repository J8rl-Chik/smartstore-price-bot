import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerIpcHandlers } from './registerIpcHandlers';

const mockHandle = vi.fn();
const mockCreatePage = vi.fn();
const mockLoginNaver = vi.fn();
const mockGetSaleProducts = vi.fn();
const mockGetProductRows = vi.fn();
const mockExcludeNewlyRegisteredProducts = vi.fn();
const mockInitRawProductRows = vi.fn();
const mockShuffleArray = vi.fn();

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

vi.mock(import('../utils/shuffleArray'), () => ({
  default: (...args: unknown[]) => mockShuffleArray(...args),
}));

// registerIpcHandlers()를 실행해 채널을 등록시킨 뒤, ipcMain.handle에 등록된 콜백 중
// 해당 채널의 콜백을 찾아 직접 호출한다. IpcMainInvokeEvent는 handler에 전달되지 않으므로 빈 객체로 대체한다.
const invokeHandler = (channel: string): unknown => {
  registerIpcHandlers();

  const call = mockHandle.mock.calls.find(([registeredChannel]) => registeredChannel === channel);

  if (!call) {
    throw new Error(`${channel} 채널이 등록되지 않았습니다.`);
  }

  const [, callback] = call;

  return callback({});
};

describe('registerIpcHandlers', () => {
  afterEach(() => {
    mockHandle.mockReset();
    mockCreatePage.mockReset();
    mockLoginNaver.mockReset();
    mockGetSaleProducts.mockReset();
    mockGetProductRows.mockReset();
    mockExcludeNewlyRegisteredProducts.mockReset();
    mockInitRawProductRows.mockReset();
    mockShuffleArray.mockReset();
  });

  it('createLoginPage 채널을 호출하면 페이지를 생성하고 네이버에 로그인한다', async () => {
    const page = { name: 'fake-page' };
    mockCreatePage.mockResolvedValue({ browser: { name: 'fake-browser' }, page });

    await invokeHandler('createLoginPage');

    expect(mockCreatePage).toHaveBeenCalled();
    expect(mockLoginNaver).toHaveBeenCalledWith(page);
  });

  it('getSaleProducts 성공 시 필터링/셔플을 거친 상품 목록을 isSuccess: true로 반환한다', async () => {
    const rawSaleProducts = [{ channelProducts: [] }];
    const filteredSaleProducts = [{ channelProducts: [] }];
    const shuffledSaleProducts = [{ channelProducts: [] }];

    mockGetSaleProducts.mockResolvedValue(rawSaleProducts);
    mockExcludeNewlyRegisteredProducts.mockReturnValue(filteredSaleProducts);
    mockShuffleArray.mockReturnValue(shuffledSaleProducts);

    const result = await invokeHandler('getSaleProducts');

    expect(mockExcludeNewlyRegisteredProducts).toHaveBeenCalledWith(rawSaleProducts);
    expect(mockShuffleArray).toHaveBeenCalledWith(filteredSaleProducts);
    expect(result).toEqual({ isSuccess: true, saleProducts: shuffledSaleProducts });
  });

  it('getSaleProducts가 예외를 던지면 콘솔에 로깅하고 isSuccess: false와 에러 메시지를 반환한다', async () => {
    const error = new Error('네이버 판매 상품 목록을 가져오지 못했습니다.');
    mockGetSaleProducts.mockRejectedValue(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await invokeHandler('getSaleProducts');

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(result).toEqual({ isSuccess: false, error: error.message });

    consoleErrorSpy.mockRestore();
  });

  it('getSaleProducts가 Error가 아닌 값을 던지면 문자열로 변환해 반환한다', async () => {
    mockGetSaleProducts.mockRejectedValue('알 수 없는 문제');

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await invokeHandler('getSaleProducts');

    expect(result).toEqual({
      isSuccess: false,
      error: 'getSaleProducts 에러: 알 수 없는 문제',
    });

    consoleErrorSpy.mockRestore();
  });

  it('getProductRows 성공 시 가공된 상품 행을 isSuccess: true로 반환한다', async () => {
    const rawProductRows = [['상품A']];
    const productRows = [{}];

    mockGetProductRows.mockResolvedValue(rawProductRows);
    mockInitRawProductRows.mockReturnValue(productRows);

    const result = await invokeHandler('getProductRows');

    expect(mockInitRawProductRows).toHaveBeenCalledWith(rawProductRows);
    expect(result).toEqual({ isSuccess: true, productRows });
  });

  it('getProductRows가 예외를 던지면 콘솔에 로깅하고 isSuccess: false와 에러 메시지를 반환한다', async () => {
    const error = new Error('Google Sheets에서 상품 목록을 가져오지 못했습니다.');
    mockGetProductRows.mockRejectedValue(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await invokeHandler('getProductRows');

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(result).toEqual({ isSuccess: false, error: error.message });

    consoleErrorSpy.mockRestore();
  });
});
