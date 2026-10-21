import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import updateTargetProducts from './updateTargetProducts';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import type { TargetProduct, UpdateState } from '../domain/product/_type';

const mockUpdateTargetProductPrice = vi.fn();
const mockDelaySeconds = vi.fn();

vi.mock(import('./updateTargetProductPrice'), () => ({
  default: (...args: unknown[]) => mockUpdateTargetProductPrice(...args),
}));

vi.mock(import('../utils/delaySeconds'), () => ({
  default: (...args: unknown[]) => mockDelaySeconds(...args),
}));

const mockEmit = vi.fn();

const updateTime = 1700000000000;
const completeUpdate = { status: 'complete', price: 39990, baseFee: 3000, time: updateTime };

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(updateTime);
  vi.spyOn(console, 'error').mockImplementation(() => {});

  mockUpdateTargetProductPrice.mockResolvedValue(completeUpdate);
  mockDelaySeconds.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  mockUpdateTargetProductPrice.mockReset();
  mockDelaySeconds.mockReset();
  mockEmit.mockReset();
});

const createTargetProduct = (originProductNo: number, name: string): TargetProduct => ({
  name,
  originProductNo,
  store: { salePrice: 45000, stockQuantity: 10, deliveryFee: 3000 },
  sheet: {
    catalogURL: `https://search.shopping.naver.com/catalog/${originProductNo}`,
    virtualPrice: 44000,
    freeDeliveryPrice: 40000,
    productPrice: 30000,
    excludedSellerNames: ['제외 스토어'],
    delivery: { feeType: '유료', baseFee: 3000 },
  },
});

const productA = createTargetProduct(111, '상품A');
const productB = createTargetProduct(222, '상품B');

const page = { name: 'fake-page' } as unknown as Page;
const myStoreName = '내 스토어';

const run = (targetProducts: TargetProduct[]): Promise<void> =>
  updateTargetProducts(page, targetProducts, myStoreName, mockEmit);

const getEmittedStates = (): UpdateState[] => mockEmit.mock.calls.map(([state]) => state);

it('시작하면 상품 전체가 wait 상태이고 isRunning이 true인 상태를 먼저 보낸다', async () => {
  await run([productA, productB]);

  expect(getEmittedStates()[0]).toEqual({
    targetProducts: [
      { ...productA, update: { status: 'wait' } },
      { ...productB, update: { status: 'wait' } },
    ],
    currentIndex: null,
    isRunning: true,
  });
});

it('상품을 처리하기 전에 currentIndex를 그 상품의 인덱스로 바꾼 상태를 보낸다', async () => {
  await run([productA, productB]);

  const currentIndexes = getEmittedStates().map(({ currentIndex }) => currentIndex);

  expect(currentIndexes).toEqual([null, 0, 0, 1, 1, null]);
});

it('상품마다 page, 상품, 내 스토어 이름으로 가격 수정을 처리한다', async () => {
  await run([productA, productB]);

  expect(mockUpdateTargetProductPrice).toHaveBeenNthCalledWith(1, page, productA, myStoreName);
  expect(mockUpdateTargetProductPrice).toHaveBeenNthCalledWith(2, page, productB, myStoreName);
});

const getLastState = (): UpdateState => getEmittedStates().at(-1) as UpdateState;

it('가격 수정에 성공하면 그 상품만 반환된 수정 결과를 반영한다', async () => {
  mockDelaySeconds.mockReturnValueOnce(new Promise(() => {}));

  void run([productA, productB]);
  await vi.waitFor(() => expect(mockDelaySeconds).toHaveBeenCalled());

  expect(getLastState().targetProducts).toEqual([
    { ...productA, update: completeUpdate },
    { ...productB, update: { status: 'wait' } },
  ]);
});

it('상품 하나에서 에러가 나면 콘솔에 로깅하고 그 상품만 error로 반영한 뒤 다음 상품을 처리한다', async () => {
  const error = new Error('가격 수정 실패');
  mockUpdateTargetProductPrice.mockRejectedValueOnce(error);

  await run([productA, productB]);

  expect(console.error).toHaveBeenCalledWith(error);
  expect(getLastState().targetProducts).toEqual([
    { ...productA, update: { status: 'error', time: updateTime } },
    { ...productB, update: completeUpdate },
  ]);
});

it('UnexpectedCatalogPageError가 나면 그 상품을 error로 반영하고 다음 상품은 처리하지 않는다', async () => {
  mockUpdateTargetProductPrice.mockRejectedValueOnce(
    new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.'),
  );

  await run([productA, productB]);

  expect(mockUpdateTargetProductPrice).toHaveBeenCalledTimes(1);
  expect(getLastState().targetProducts).toEqual([
    { ...productA, update: { status: 'error', time: updateTime } },
    { ...productB, update: { status: 'wait' } },
  ]);
});

it('상품을 처리할 때마다 5초 대기한다', async () => {
  await run([productA, productB]);

  expect(mockDelaySeconds).toHaveBeenCalledTimes(2);
  expect(mockDelaySeconds).toHaveBeenCalledWith(5);
});

it('순회가 끝나면 currentIndex를 null로, isRunning을 false로 바꾼 상태를 보낸다', async () => {
  await run([productA]);

  expect(getLastState()).toMatchObject({ currentIndex: null, isRunning: false });
});

it('치명적 실패로 중단해도 currentIndex를 null로, isRunning을 false로 바꾼 상태를 보낸다', async () => {
  mockUpdateTargetProductPrice.mockRejectedValueOnce(
    new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.'),
  );

  await run([productA, productB]);

  expect(getLastState()).toMatchObject({ currentIndex: null, isRunning: false });
});

it('상품 목록이 비어 있으면 시작 상태와 종료 상태만 보낸다', async () => {
  await run([]);

  expect(getEmittedStates()).toEqual([
    { targetProducts: [], currentIndex: null, isRunning: true },
    { targetProducts: [], currentIndex: null, isRunning: false },
  ]);
});
