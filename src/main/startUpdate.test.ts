import { afterEach, expect, it, vi } from 'vitest';
import type { WebContents } from 'electron';
import createStartUpdate from './startUpdate';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import { ERROR_MESSAGE } from '../domain/error/errorMessage';
import type { UpdateState } from '../domain/product/_type';
import type { StartUpdateResult } from '../preload/_type';

const mockGetLoggedInPage = vi.fn();
const mockIsPageClosed = vi.fn();
const mockFetchTargetProducts = vi.fn();
const mockValidateEnv = vi.fn();
const mockUpdateTargetProductPrice = vi.fn();
const mockDelaySeconds = vi.fn();
const mockSend = vi.fn();

vi.mock(import('./browserSession'), () => ({
  getLoggedInPage: (...args: unknown[]) => mockGetLoggedInPage(...args),
  isPageClosed: (...args: unknown[]) => mockIsPageClosed(...args),
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

afterEach(() => {
  vi.restoreAllMocks();
  mockGetLoggedInPage.mockReset();
  mockIsPageClosed.mockReset();
  mockFetchTargetProducts.mockReset();
  mockValidateEnv.mockReset();
  mockUpdateTargetProductPrice.mockReset();
  mockDelaySeconds.mockReset();
  mockSend.mockReset();
});

// 상태를 보내는 send만 가진 가짜 sender
const fakeSender = { send: mockSend } as unknown as WebContents;

/**
 * 새 핸들러를 만들어 한 번 호출한다. 핸들러마다 isUpdateRunning이 새로 생기므로 테스트끼리 섞이지 않는다.
 * 순회 중 재호출처럼 호출 간 공유 상태를 검증할 때는 createStartUpdate()로 만든 핸들러를 여러 번 호출한다.
 */
const runStartUpdate = (): Promise<StartUpdateResult> => createStartUpdate()(fakeSender);

// 조회할 가격 수정 대상 목록과 변환에 실패한 시트 행을 정한다.
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

const productA = { name: '상품A', originProductNo: 111 };
const productB = { name: '상품B', originProductNo: 222 };

// 로그인한 페이지 자리에 넘기는 가짜 page. 닫힘 여부는 mockIsPageClosed로 정한다.
const fakePage = {};

it('상품마다 로그인한 페이지, 상품, 내 스토어 이름으로 가격 수정을 처리한다', async () => {
  mockFetchedTargetProducts([productA, productB]);
  mockValidateEnv.mockReturnValue('내 스토어');
  mockGetLoggedInPage.mockResolvedValue(fakePage);

  await runStartUpdate();

  expect(mockValidateEnv).toHaveBeenCalledWith('SMART_STORE_NAME');
  expect(mockUpdateTargetProductPrice).toHaveBeenNthCalledWith(1, fakePage, productA, '내 스토어');
  expect(mockUpdateTargetProductPrice).toHaveBeenNthCalledWith(2, fakePage, productB, '내 스토어');
});

it('순회를 끝내면 done 결과를 돌려준다', async () => {
  mockFetchedTargetProducts([productA]);
  mockGetLoggedInPage.mockResolvedValue(fakePage);

  await expect(runStartUpdate()).resolves.toEqual({ status: 'done' });
});

it('수정할 상품이 없어 끝나도 done 결과를 돌려준다', async () => {
  mockFetchedTargetProducts([]);

  await expect(runStartUpdate()).resolves.toEqual({ status: 'done' });
});

it('수정할 상품이 없으면 로그인과 순회를 하지 않고 빈 목록으로 끝난 상태를 보낸다', async () => {
  mockFetchedTargetProducts([]);

  await runStartUpdate();

  expect(mockGetLoggedInPage).not.toHaveBeenCalled();
  expect(mockUpdateTargetProductPrice).not.toHaveBeenCalled();
  expect(mockSend).toHaveBeenCalledWith('updateState', {
    targetProducts: [],
    invalidProductRows: [],
    currentIndex: null,
    isPreparing: false,
    isRunning: false,
  });
});

const invalidProductRow = { name: '상품C', errorMessages: ['productPrice: 에러'] };

it('변환에 실패한 시트 행을 담아 순회 시작 상태로 보낸다', async () => {
  mockFetchedTargetProducts([productA], [invalidProductRow]);
  mockGetLoggedInPage.mockResolvedValue(fakePage);

  await runStartUpdate();

  expect(mockSend).toHaveBeenNthCalledWith(
    2,
    'updateState',
    expect.objectContaining({ invalidProductRows: [invalidProductRow] }),
  );
});

it('수정할 상품이 없어도 변환에 실패한 시트 행을 담아 끝난 상태를 보낸다', async () => {
  mockFetchedTargetProducts([], [invalidProductRow]);

  await runStartUpdate();

  expect(mockSend).toHaveBeenCalledWith('updateState', {
    targetProducts: [],
    invalidProductRows: [invalidProductRow],
    currentIndex: null,
    isPreparing: false,
    isRunning: false,
  });
});

const getSentStates = (): UpdateState[] => mockSend.mock.calls.map(([, state]) => state);

const getLastSentState = (): UpdateState => getSentStates().at(-1) as UpdateState;

it('목록 조회·로그인을 시작하기 전에 isPreparing이 true인 상태를 보낸다', async () => {
  mockFetchTargetProducts.mockReturnValue(new Promise(() => {}));

  void runStartUpdate();
  await vi.waitFor(() => expect(mockFetchTargetProducts).toHaveBeenCalled());

  expect(getLastSentState()).toMatchObject({ isPreparing: true });
});

it('순회가 도는 중에 다시 호출되면 새 순회를 시작하지 않는다', async () => {
  mockFetchedTargetProducts([productA]);
  mockGetLoggedInPage.mockResolvedValue(fakePage);
  mockUpdateTargetProductPrice.mockReturnValue(new Promise(() => {}));

  const startUpdate = createStartUpdate();
  void startUpdate(fakeSender);
  await vi.waitFor(() => expect(mockUpdateTargetProductPrice).toHaveBeenCalled());
  await startUpdate(fakeSender);

  expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
});

it('순회가 도는 중에 다시 호출되면 running 결과를 돌려준다', async () => {
  mockFetchedTargetProducts([productA]);
  mockGetLoggedInPage.mockResolvedValue(fakePage);
  mockUpdateTargetProductPrice.mockReturnValue(new Promise(() => {}));

  const startUpdate = createStartUpdate();
  void startUpdate(fakeSender);
  await vi.waitFor(() => expect(mockUpdateTargetProductPrice).toHaveBeenCalled());

  await expect(startUpdate(fakeSender)).resolves.toEqual({ status: 'running' });
});

it('순회가 도는 중에 다시 호출되면 상태를 보내지 않는다', async () => {
  mockFetchedTargetProducts([productA]);
  mockGetLoggedInPage.mockResolvedValue(fakePage);
  mockUpdateTargetProductPrice.mockReturnValue(new Promise(() => {}));

  const startUpdate = createStartUpdate();
  void startUpdate(fakeSender);
  await vi.waitFor(() => expect(mockUpdateTargetProductPrice).toHaveBeenCalled());
  const sentCount = mockSend.mock.calls.length;
  await startUpdate(fakeSender);

  expect(mockSend).toHaveBeenCalledTimes(sentCount);
});

it('순회가 끝나면 다시 호출했을 때 새 순회를 시작한다', async () => {
  mockFetchedTargetProducts([productA]);
  mockGetLoggedInPage.mockResolvedValue(fakePage);

  const startUpdate = createStartUpdate();
  await startUpdate(fakeSender);
  await startUpdate(fakeSender);

  expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(2);
});

it('다시 시작하면 이전 순회의 상품 목록을 이어받지 않고 빈 상태로 준비 중 상태를 보낸다', async () => {
  mockFetchedTargetProducts([productA]);
  mockGetLoggedInPage.mockResolvedValue(fakePage);

  const startUpdate = createStartUpdate();
  await startUpdate(fakeSender);
  mockSend.mockClear();
  await startUpdate(fakeSender);

  const [preparingState] = getSentStates();

  expect(preparingState).toEqual({
    targetProducts: [],
    invalidProductRows: [],
    currentIndex: null,
    isPreparing: true,
    isRunning: false,
  });
});

it('처리 중 예외가 발생하면 콘솔에 로깅하고, 다시 호출했을 때 새로 시작한다', async () => {
  const error = new Error('네이버 판매 상품 목록을 가져오지 못했습니다.');
  mockFetchedTargetProducts([productA]);
  mockFetchTargetProducts.mockRejectedValueOnce(error);
  mockGetLoggedInPage.mockResolvedValue(fakePage);

  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  const startUpdate = createStartUpdate();
  await startUpdate(fakeSender);
  await startUpdate(fakeSender);

  expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
});

it('목록 조회에 실패하면 throw하지 않고 error 결과로 가장 바깥 에러의 메시지를 돌려준다', async () => {
  mockFetchTargetProducts.mockRejectedValue(
    new Error(ERROR_MESSAGE.SHEET_FETCH_FAILED, { cause: new Error('원인 에러') }),
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await expect(runStartUpdate()).resolves.toEqual({
    status: 'error',
    message: ERROR_MESSAGE.SHEET_FETCH_FAILED,
  });
});

it('목록 조회에 실패하면 isPreparing을 false로 바꾼 상태를 보낸다', async () => {
  mockFetchTargetProducts.mockRejectedValue(new Error(ERROR_MESSAGE.SHEET_FETCH_FAILED));
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await runStartUpdate();

  expect(getLastSentState()).toMatchObject({ isPreparing: false });
});

it('로그인에 실패하면 순회 상태를 보내지 않고 error 결과로 메시지를 돌려준다', async () => {
  mockFetchedTargetProducts([productA]);
  mockGetLoggedInPage.mockRejectedValue(new Error(ERROR_MESSAGE.NAVER_LOGIN_FAILED));
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await expect(runStartUpdate()).resolves.toEqual({
    status: 'error',
    message: ERROR_MESSAGE.NAVER_LOGIN_FAILED,
  });
  // 준비 시작과 준비 끝 상태만 보내고, 순회 상태는 보내지 않는다.
  expect(getSentStates().map(({ isPreparing }) => isPreparing)).toEqual([true, false]);
});

it('순회를 시작하기 전에 Error가 아닌 값이 던져지면 알 수 없는 에러 메시지를 돌려준다', async () => {
  mockFetchTargetProducts.mockRejectedValue('문자열 에러');
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await expect(runStartUpdate()).resolves.toEqual({
    status: 'error',
    message: ERROR_MESSAGE.UNKNOWN_ERROR,
  });
});

// 순회 테스트에서 상품 목록 조회와 로그인까지 마친 상태로 만든다.
const mockLoggedInWith = (targetProducts: unknown[]): void => {
  mockFetchedTargetProducts(targetProducts);
  mockGetLoggedInPage.mockResolvedValue(fakePage);
};

it('준비를 마치면 상품 전체가 wait 상태이고 isRunning이 true인 순회 시작 상태를 보낸다', async () => {
  mockLoggedInWith([productA, productB]);

  await runStartUpdate();

  expect(mockSend).toHaveBeenNthCalledWith(2, 'updateState', {
    targetProducts: [
      { ...productA, update: { status: 'wait' } },
      { ...productB, update: { status: 'wait' } },
    ],
    invalidProductRows: [],
    currentIndex: null,
    isPreparing: false,
    isRunning: true,
  });
});

it('상품을 처리하기 전에 currentIndex를 그 상품의 인덱스로 바꾼 상태를 보낸다', async () => {
  mockLoggedInWith([productA, productB]);

  await runStartUpdate();

  const currentIndexes = getSentStates().map(({ currentIndex }) => currentIndex);

  // 준비 중, 순회 시작, 상품마다 처리 전·결과 반영, 순회 끝 순서로 보낸다.
  expect(currentIndexes).toEqual([null, null, 0, 0, 1, 1, null]);
});

const updateTime = 1700000000000;
const completeUpdate = { status: 'complete', price: 39990, baseFee: 3000, time: updateTime };

it('가격 수정에 성공하면 그 상품만 반환된 수정 결과를 반영한 상태를 보낸다', async () => {
  mockLoggedInWith([productA, productB]);
  mockUpdateTargetProductPrice.mockResolvedValue(completeUpdate);
  mockDelaySeconds.mockReturnValueOnce(new Promise(() => {}));

  void runStartUpdate();
  await vi.waitFor(() => expect(mockDelaySeconds).toHaveBeenCalled());

  expect(getLastSentState().targetProducts).toEqual([
    { ...productA, update: completeUpdate },
    { ...productB, update: { status: 'wait' } },
  ]);
});

it('수정 결과를 반영해도 이전에 보낸 상품 목록은 바꾸지 않는다', async () => {
  mockLoggedInWith([productA]);
  mockUpdateTargetProductPrice.mockResolvedValue(completeUpdate);

  await runStartUpdate();

  // 두 번째로 보낸 상태가 상품 전체를 wait로 둔 순회 시작 상태다.
  const [, initialState] = getSentStates();

  expect(initialState.targetProducts[0].update).toEqual({ status: 'wait' });
});

it('상품 하나에서 에러가 나면 콘솔에 로깅하고 그 상품만 error로 반영한 뒤 다음 상품을 처리한다', async () => {
  const error = new Error('가격 수정 실패');
  mockLoggedInWith([productA, productB]);
  mockUpdateTargetProductPrice.mockRejectedValueOnce(error).mockResolvedValueOnce(completeUpdate);
  vi.spyOn(Date, 'now').mockReturnValue(updateTime);
  const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  await runStartUpdate();

  expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  expect(getLastSentState().targetProducts).toEqual([
    { ...productA, update: { status: 'error', message: '가격 수정 실패', time: updateTime } },
    { ...productB, update: completeUpdate },
  ]);
});

it('원인 에러를 cause로 감싼 에러가 나면 가장 바깥 에러의 메시지만 담아 보낸다', async () => {
  const error = new Error('네이버 상품 가격을 수정하지 못했습니다.', {
    cause: new Error('네이버 접근 토큰을 발급받지 못했습니다.'),
  });
  mockLoggedInWith([productA]);
  mockUpdateTargetProductPrice.mockRejectedValueOnce(error);
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await runStartUpdate();

  expect(getLastSentState().targetProducts[0].update).toMatchObject({
    status: 'error',
    message: '네이버 상품 가격을 수정하지 못했습니다.',
  });
});

it('Error가 아닌 값이 던져지면 알 수 없는 에러 메시지를 담아 보낸다', async () => {
  mockLoggedInWith([productA]);
  mockUpdateTargetProductPrice.mockRejectedValueOnce('문자열 에러');
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await runStartUpdate();

  expect(getLastSentState().targetProducts[0].update).toMatchObject({
    status: 'error',
    message: ERROR_MESSAGE.UNKNOWN_ERROR,
  });
});

it('UnexpectedCatalogPageError가 나면 그 상품을 error로 반영하고 다음 상품은 처리하지 않는다', async () => {
  mockLoggedInWith([productA, productB]);
  mockUpdateTargetProductPrice.mockRejectedValueOnce(
    new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.'),
  );
  vi.spyOn(Date, 'now').mockReturnValue(updateTime);
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await runStartUpdate();

  expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
  expect(getLastSentState().targetProducts).toEqual([
    {
      ...productA,
      update: {
        status: 'error',
        message: '네이버 쇼핑 접속이 일시적으로 제한되었습니다.',
        time: updateTime,
      },
    },
    { ...productB, update: { status: 'wait' } },
  ]);
});

it('cause로 감싼 UnexpectedCatalogPageError가 나면 원인 에러의 메시지를 반영하고 다음 상품은 처리하지 않는다', async () => {
  mockLoggedInWith([productA, productB]);
  mockUpdateTargetProductPrice.mockRejectedValueOnce(
    new Error(ERROR_MESSAGE.SELLERS_FETCH_FAILED, {
      cause: new UnexpectedCatalogPageError(ERROR_MESSAGE.CATALOG_BLOCKED),
    }),
  );
  vi.spyOn(Date, 'now').mockReturnValue(updateTime);
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await runStartUpdate();

  expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
  expect(getLastSentState().targetProducts).toEqual([
    {
      ...productA,
      update: { status: 'error', message: ERROR_MESSAGE.CATALOG_BLOCKED, time: updateTime },
    },
    { ...productB, update: { status: 'wait' } },
  ]);
});

it('사용자가 브라우저를 닫으면 다음 상품은 처리하지 않고 끝난 상태를 보낸다', async () => {
  mockLoggedInWith([productA, productB]);
  mockIsPageClosed.mockReturnValue(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await runStartUpdate();

  expect(mockIsPageClosed).toHaveBeenCalledWith(fakePage);
  expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
  expect(getLastSentState()).toMatchObject({ currentIndex: null, isRunning: false });
});

it('상품을 처리할 때마다 5초 대기한다', async () => {
  mockLoggedInWith([productA, productB]);

  await runStartUpdate();

  expect(mockDelaySeconds).toHaveBeenCalledTimes(2);
  expect(mockDelaySeconds).toHaveBeenCalledWith(5);
});

it('순회가 끝나면 currentIndex를 null로, isRunning을 false로 바꾼 상태를 보낸다', async () => {
  mockLoggedInWith([productA]);

  await runStartUpdate();

  expect(getLastSentState()).toMatchObject({ currentIndex: null, isRunning: false });
});

it('치명적 실패로 중단해도 currentIndex를 null로, isRunning을 false로 바꾼 상태를 보낸다', async () => {
  mockLoggedInWith([productA, productB]);
  mockUpdateTargetProductPrice.mockRejectedValueOnce(
    new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.'),
  );
  vi.spyOn(console, 'error').mockImplementation(() => {});

  await runStartUpdate();

  expect(getLastSentState()).toMatchObject({ currentIndex: null, isRunning: false });
});
