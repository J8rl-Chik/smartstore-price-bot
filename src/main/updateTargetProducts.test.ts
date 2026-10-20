import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import updateTargetProducts from './updateTargetProducts';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import type { TargetProduct, UpdateState } from '../domain/product/_type';

const mockGetSellersInPuppeteer = vi.fn();
const mockUpdatePrice = vi.fn();
const mockFilterExcludedSellers = vi.fn();
const mockAddVirtualPrice = vi.fn();
const mockCalculateTargetPrice = vi.fn();
const mockBuildPriceWithDeliveryFee = vi.fn();
const mockDelaySeconds = vi.fn();

vi.mock(import('../integrations/puppeteer/getSellersInPuppeteer'), () => ({
  default: (...args: unknown[]) => mockGetSellersInPuppeteer(...args),
}));

vi.mock(import('../integrations/smartStore/updatePrice'), () => ({
  default: (...args: unknown[]) => mockUpdatePrice(...args),
}));

vi.mock(import('../domain/seller/filterExcludedSellers'), () => ({
  filterExcludedSellers: (...args: unknown[]) => mockFilterExcludedSellers(...args),
}));

vi.mock(import('../domain/price/addVirtualPrice'), () => ({
  addVirtualPrice: (...args: unknown[]) => mockAddVirtualPrice(...args),
}));

vi.mock(import('../domain/price/price'), () => ({
  calculateTargetPrice: (...args: unknown[]) => mockCalculateTargetPrice(...args),
}));

vi.mock(import('../domain/delivery/delivery'), () => ({
  buildPriceWithDeliveryFee: (...args: unknown[]) => mockBuildPriceWithDeliveryFee(...args),
}));

vi.mock(import('../utils/delaySeconds'), () => ({
  default: (...args: unknown[]) => mockDelaySeconds(...args),
}));

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
const mockEmit = vi.fn();

const run = (targetProducts: TargetProduct[]): Promise<void> =>
  updateTargetProducts(page, targetProducts, myStoreName, mockEmit);

const getEmittedStates = (): UpdateState[] => mockEmit.mock.calls.map(([state]) => state);

const getLastState = (): UpdateState => getEmittedStates().at(-1) as UpdateState;

const updateTime = 1700000000000;

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(updateTime);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});

  mockGetSellersInPuppeteer.mockResolvedValue([
    { name: '다른 스토어', price: 43000, deliveryFee: 0, deliveryFeeType: '무료' },
  ]);
  mockFilterExcludedSellers.mockImplementation((sellers) => sellers);
  mockAddVirtualPrice.mockReturnValue([43000, 44000]);
  mockCalculateTargetPrice.mockReturnValue(42990);
  mockBuildPriceWithDeliveryFee.mockReturnValue({
    deliveryFee: { deliveryFeeType: 'PAID', deliveryFeePayType: 'PREPAID', baseFee: 3000 },
    salePrice: 39990,
  });
  mockUpdatePrice.mockResolvedValue({
    salePrice: 39990,
    deliveryInfo: { deliveryFee: { baseFee: 3000 } },
  });
  mockDelaySeconds.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  mockGetSellersInPuppeteer.mockReset();
  mockUpdatePrice.mockReset();
  mockFilterExcludedSellers.mockReset();
  mockAddVirtualPrice.mockReset();
  mockCalculateTargetPrice.mockReset();
  mockBuildPriceWithDeliveryFee.mockReset();
  mockDelaySeconds.mockReset();
  mockEmit.mockReset();
});

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

it('상품의 카탈로그 URL과 상품명으로 판매처를 조회한다', async () => {
  await run([productA]);

  expect(mockGetSellersInPuppeteer).toHaveBeenCalledWith(
    page,
    productA.sheet.catalogURL,
    productA.name,
  );
});

it('판매처를 필터링할 때 시트의 제외 판매처와 함께 내 스토어도 제외한다', async () => {
  const sellers = [{ name: '다른 스토어', price: 43000, deliveryFee: 0, deliveryFeeType: '무료' }];
  mockGetSellersInPuppeteer.mockResolvedValue(sellers);

  await run([productA]);

  expect(mockFilterExcludedSellers).toHaveBeenCalledWith(sellers, ['제외 스토어', myStoreName]);
});

it('필터링한 판매처 가격에 가상 가격을 더해 무료배송 기준가로 목표 가격을 계산한다', async () => {
  mockFilterExcludedSellers.mockReturnValue([
    { name: '다른 스토어', price: 43000, deliveryFee: 0, deliveryFeeType: '무료' },
  ]);

  await run([productA]);

  expect(mockAddVirtualPrice).toHaveBeenCalledWith([43000], productA.sheet.virtualPrice);
  expect(mockCalculateTargetPrice).toHaveBeenCalledWith(
    [43000, 44000],
    productA.sheet.freeDeliveryPrice,
  );
});

it('목표 가격과 배송비 설정으로 계산한 판매가와 배송비로 가격 수정을 요청한다', async () => {
  await run([productA]);

  expect(mockBuildPriceWithDeliveryFee).toHaveBeenCalledWith(productA.sheet.delivery, 42990);
  expect(mockUpdatePrice).toHaveBeenCalledWith({
    productNo: productA.originProductNo,
    deliveryFee: { deliveryFeeType: 'PAID', deliveryFeePayType: 'PREPAID', baseFee: 3000 },
    salePrice: 39990,
  });
});

it('가격 수정에 성공하면 그 상품만 응답의 판매가와 기본 배송비로 complete 상태를 반영한다', async () => {
  mockUpdatePrice.mockResolvedValueOnce({
    salePrice: 39990,
    deliveryInfo: { deliveryFee: { baseFee: 3000 } },
  });
  mockDelaySeconds.mockReturnValueOnce(new Promise(() => {}));

  void run([productA, productB]);
  await vi.waitFor(() => expect(mockDelaySeconds).toHaveBeenCalled());

  expect(getLastState().targetProducts).toEqual([
    {
      ...productA,
      update: { status: 'complete', price: 39990, baseFee: 3000, time: updateTime },
    },
    { ...productB, update: { status: 'wait' } },
  ]);
});

it('DRY_RUN이 true이면 가격 수정을 요청하지 않고 계산한 판매가와 기본 배송비로 complete 상태를 반영한다', async () => {
  vi.stubEnv('DRY_RUN', 'true');

  await run([productA]);

  expect(mockUpdatePrice).not.toHaveBeenCalled();
  expect(getLastState().targetProducts[0].update).toEqual({
    status: 'complete',
    price: 39990,
    baseFee: 3000,
    time: updateTime,
  });
});

it('DRY_RUN이 true이고 배송비가 무료이면 기본 배송비를 0으로 반영한다', async () => {
  vi.stubEnv('DRY_RUN', 'true');
  mockBuildPriceWithDeliveryFee.mockReturnValue({
    deliveryFee: { deliveryFeeType: 'FREE' },
    salePrice: 42990,
  });

  await run([productA]);

  expect(getLastState().targetProducts[0].update).toEqual({
    status: 'complete',
    price: 42990,
    baseFee: 0,
    time: updateTime,
  });
});

it('판매처가 없으면 가격을 수정하지 않고 그 상품을 error로 반영한 뒤 다음 상품을 처리한다', async () => {
  mockGetSellersInPuppeteer.mockResolvedValueOnce([]);

  await run([productA, productB]);

  expect(mockUpdatePrice).toHaveBeenCalledTimes(1);
  expect(getLastState().targetProducts.map(({ update }) => update.status)).toEqual([
    'error',
    'complete',
  ]);
});

it('상품 하나에서 에러가 나면 콘솔에 로깅하고 그 상품만 error로 반영한 뒤 다음 상품을 처리한다', async () => {
  const error = new Error('가격 수정 실패');
  mockUpdatePrice.mockRejectedValueOnce(error);

  await run([productA, productB]);

  expect(console.error).toHaveBeenCalledWith(error);
  expect(getLastState().targetProducts).toEqual([
    { ...productA, update: { status: 'error', time: updateTime } },
    {
      ...productB,
      update: { status: 'complete', price: 39990, baseFee: 3000, time: updateTime },
    },
  ]);
});

it('UnexpectedCatalogPageError가 나면 그 상품을 error로 반영하고 다음 상품은 처리하지 않는다', async () => {
  mockGetSellersInPuppeteer.mockRejectedValueOnce(
    new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.'),
  );

  await run([productA, productB]);

  expect(mockGetSellersInPuppeteer).toHaveBeenCalledTimes(1);
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
  mockGetSellersInPuppeteer.mockRejectedValueOnce(
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
