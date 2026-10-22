import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import updateTargetProductPrice from './updateTargetProductPrice';
import type { TargetProduct, TargetProductUpdate } from '../domain/product/_type';

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

vi.mock(import('../domain/delivery/buildPriceWithDeliveryFee'), () => ({
  buildPriceWithDeliveryFee: (...args: unknown[]) => mockBuildPriceWithDeliveryFee(...args),
}));

const mockGetSellersInPuppeteer = vi.fn();
const mockUpdatePrice = vi.fn();
const mockFilterExcludedSellers = vi.fn();
const mockAddVirtualPrice = vi.fn();
const mockCalculateTargetPrice = vi.fn();
const mockBuildPriceWithDeliveryFee = vi.fn();

const updateTime = 1700000000000;

beforeEach(() => {
  vi.spyOn(Date, 'now').mockReturnValue(updateTime);
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
});

const page = { name: 'fake-page' } as unknown as Page;
const myStoreName = '내 스토어';

const targetProduct: TargetProduct = {
  name: '상품A',
  originProductNo: 111,
  store: { salePrice: 45000, stockQuantity: 10, deliveryFee: 3000 },
  sheet: {
    catalogURL: 'https://search.shopping.naver.com/catalog/111',
    virtualPrice: 44000,
    freeDeliveryPrice: 40000,
    productPrice: 30000,
    excludedSellerNames: ['제외 스토어'],
    delivery: { feeType: '유료', baseFee: 3000 },
  },
};

const run = (): Promise<TargetProductUpdate> =>
  updateTargetProductPrice(page, targetProduct, myStoreName);

it('상품의 카탈로그 URL과 상품명으로 판매처를 조회한다', async () => {
  await run();

  expect(mockGetSellersInPuppeteer).toHaveBeenCalledWith(
    page,
    targetProduct.sheet.catalogURL,
    targetProduct.name,
  );
});

it('판매처가 없으면 가격을 수정하지 않고 에러를 던진다', async () => {
  mockGetSellersInPuppeteer.mockResolvedValue([]);

  await expect(run()).rejects.toThrow('상품A: 가격 목록이 없습니다.');
  expect(mockUpdatePrice).not.toHaveBeenCalled();
});

it('판매처를 필터링할 때 시트의 제외 판매처와 함께 내 스토어도 제외한다', async () => {
  const sellers = [{ name: '다른 스토어', price: 43000, deliveryFee: 0, deliveryFeeType: '무료' }];
  mockGetSellersInPuppeteer.mockResolvedValue(sellers);

  await run();

  expect(mockFilterExcludedSellers).toHaveBeenCalledWith(sellers, ['제외 스토어', myStoreName]);
});

it('필터링한 판매처 가격에 가상 가격을 더해 무료배송 기준가로 목표 가격을 계산한다', async () => {
  mockFilterExcludedSellers.mockReturnValue([
    { name: '다른 스토어', price: 43000, deliveryFee: 0, deliveryFeeType: '무료' },
  ]);

  await run();

  expect(mockAddVirtualPrice).toHaveBeenCalledWith([43000], targetProduct.sheet.virtualPrice);
  expect(mockCalculateTargetPrice).toHaveBeenCalledWith(
    [43000, 44000],
    targetProduct.sheet.freeDeliveryPrice,
  );
});

it('목표 가격과 배송비 설정으로 계산한 판매가와 배송비로 가격 수정을 요청한다', async () => {
  await run();

  expect(mockBuildPriceWithDeliveryFee).toHaveBeenCalledWith(targetProduct.sheet.delivery, 42990);
  expect(mockUpdatePrice).toHaveBeenCalledWith({
    productNo: targetProduct.originProductNo,
    deliveryFee: { deliveryFeeType: 'PAID', deliveryFeePayType: 'PREPAID', baseFee: 3000 },
    salePrice: 39990,
  });
});

it('가격 수정에 성공하면 응답의 판매가와 기본 배송비로 complete 상태를 반환한다', async () => {
  mockUpdatePrice.mockResolvedValue({
    salePrice: 38990,
    deliveryInfo: { deliveryFee: { baseFee: 2500 } },
  });

  expect(await run()).toEqual({
    status: 'complete',
    price: 38990,
    baseFee: 2500,
    time: updateTime,
  });
});

it('가격 수정 요청이 실패하면 에러를 그대로 던진다', async () => {
  const error = new Error('가격 수정 실패');
  mockUpdatePrice.mockRejectedValue(error);

  await expect(run()).rejects.toBe(error);
});

it('DRY_RUN이 true이면 가격 수정을 요청하지 않고 계산한 판매가와 기본 배송비로 complete 상태를 반환한다', async () => {
  vi.stubEnv('DRY_RUN', 'true');

  expect(await run()).toEqual({
    status: 'complete',
    price: 39990,
    baseFee: 3000,
    time: updateTime,
  });
  expect(mockUpdatePrice).not.toHaveBeenCalled();
});

it('DRY_RUN이 true이고 배송비가 무료이면 기본 배송비를 0으로 반환한다', async () => {
  vi.stubEnv('DRY_RUN', 'true');
  mockBuildPriceWithDeliveryFee.mockReturnValue({
    deliveryFee: { deliveryFeeType: 'FREE' },
    salePrice: 42990,
  });

  expect(await run()).toEqual({
    status: 'complete',
    price: 42990,
    baseFee: 0,
    time: updateTime,
  });
});
