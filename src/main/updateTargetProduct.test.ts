import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import updateTargetProduct from './updateTargetProduct';
import { UnexpectedCatalogPageError } from '../integrations/puppeteer/validateCatalogPage';
import type { TargetProduct } from '../domain/product/_type';
import type { Seller } from '../domain/seller/filterExcludedSellers';

const mockGetSellersInPuppeteer = vi.fn();
const mockUpdatePrice = vi.fn();
const mockFilterExcludedSellers = vi.fn();
const mockAddVirtualPrice = vi.fn();
const mockCalculateTargetPrice = vi.fn();
const mockIsPriceUpdateRequired = vi.fn();
const mockBuildPriceWithDeliveryFee = vi.fn();

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
  isPriceUpdateRequired: (...args: unknown[]) => mockIsPriceUpdateRequired(...args),
}));

vi.mock(import('../domain/delivery/delivery'), () => ({
  buildPriceWithDeliveryFee: (...args: unknown[]) => mockBuildPriceWithDeliveryFee(...args),
}));

const PAGE = { name: 'fake-page' } as unknown as Page;
const MY_STORE_NAME = '내스토어';

const TARGET_PRODUCT: TargetProduct = {
  name: '무선 이어폰 프로',
  originProductNo: 1,
  store: { salePrice: 42900, stockQuantity: 10, deliveryFee: 0 },
  sheet: {
    catalogURL: 'https://catalog.example/1',
    delivery: { feeType: '무료' },
    freeDeliveryPrice: 0,
    productPrice: 42900,
    virtualPrice: null,
    excludedSellerNames: ['판매처C'],
  },
};

const SELLERS: Seller[] = [
  { name: MY_STORE_NAME, price: 42900, deliveryFee: 0, deliveryFeeType: '무료' },
  { name: '판매처A', price: 43000, deliveryFee: 0, deliveryFeeType: '무료' },
];
const FILTERED_SELLERS: Seller[] = [SELLERS[1]];

afterEach(() => {
  vi.unstubAllEnvs();
  mockGetSellersInPuppeteer.mockReset();
  mockUpdatePrice.mockReset();
  mockFilterExcludedSellers.mockReset();
  mockAddVirtualPrice.mockReset();
  mockCalculateTargetPrice.mockReset();
  mockIsPriceUpdateRequired.mockReset();
  mockBuildPriceWithDeliveryFee.mockReset();
});

describe('updateTargetProduct', () => {
  it('판매처가 없으면 조회 이후 어떤 처리도 하지 않고 skipped를 반환한다', async () => {
    mockGetSellersInPuppeteer.mockResolvedValue([]);

    const result = await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(result).toEqual({ status: 'skipped' });
    expect(mockFilterExcludedSellers).not.toHaveBeenCalled();
  });

  it('판매처를 조회하면 내 스토어 이름을 제외 판매처와 함께 필터링을 요청한다', async () => {
    mockGetSellersInPuppeteer.mockResolvedValue(SELLERS);
    mockFilterExcludedSellers.mockReturnValue(FILTERED_SELLERS);
    mockAddVirtualPrice.mockReturnValue([43000]);
    mockCalculateTargetPrice.mockReturnValue(42900);
    mockIsPriceUpdateRequired.mockReturnValue(false);

    await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(mockFilterExcludedSellers).toHaveBeenCalledWith(SELLERS, ['판매처C', MY_STORE_NAME]);
  });

  it('필터링한 판매처 가격에 가상 가격을 더해 목표 가격을 계산한다', async () => {
    const productWithVirtualPrice: TargetProduct = {
      ...TARGET_PRODUCT,
      sheet: { ...TARGET_PRODUCT.sheet, virtualPrice: 41000, freeDeliveryPrice: 30000 },
    };

    mockGetSellersInPuppeteer.mockResolvedValue(SELLERS);
    mockFilterExcludedSellers.mockReturnValue(FILTERED_SELLERS);
    mockAddVirtualPrice.mockReturnValue([43000, 41000]);
    mockCalculateTargetPrice.mockReturnValue(42900);
    mockIsPriceUpdateRequired.mockReturnValue(false);

    await updateTargetProduct(PAGE, productWithVirtualPrice, MY_STORE_NAME);

    expect(mockAddVirtualPrice).toHaveBeenCalledWith([43000], 41000);
    expect(mockCalculateTargetPrice).toHaveBeenCalledWith([43000, 41000], 30000);
  });

  it('isPriceUpdateRequired를 판단할 때 필터링 전 목록에서 찾은 내 스토어를 사용한다', async () => {
    mockGetSellersInPuppeteer.mockResolvedValue(SELLERS);
    mockFilterExcludedSellers.mockReturnValue(FILTERED_SELLERS);
    mockAddVirtualPrice.mockReturnValue([43000]);
    mockCalculateTargetPrice.mockReturnValue(42900);
    mockIsPriceUpdateRequired.mockReturnValue(false);

    await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(mockIsPriceUpdateRequired).toHaveBeenCalledWith(SELLERS[0], 42900, '무료');
  });

  it('isPriceUpdateRequired가 false이면 가격을 수정하지 않고 skipped를 반환한다', async () => {
    mockGetSellersInPuppeteer.mockResolvedValue(SELLERS);
    mockFilterExcludedSellers.mockReturnValue(FILTERED_SELLERS);
    mockAddVirtualPrice.mockReturnValue([43000]);
    mockCalculateTargetPrice.mockReturnValue(42900);
    mockIsPriceUpdateRequired.mockReturnValue(false);

    const result = await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(result).toEqual({ status: 'skipped' });
    expect(mockBuildPriceWithDeliveryFee).not.toHaveBeenCalled();
    expect(mockUpdatePrice).not.toHaveBeenCalled();
  });

  it('가격 수정이 필요하면 목표 가격과 상품의 배송비 설정으로 수정을 요청하고 updated를 반환한다', async () => {
    mockGetSellersInPuppeteer.mockResolvedValue(SELLERS);
    mockFilterExcludedSellers.mockReturnValue(FILTERED_SELLERS);
    mockAddVirtualPrice.mockReturnValue([43000]);
    mockCalculateTargetPrice.mockReturnValue(42990);
    mockIsPriceUpdateRequired.mockReturnValue(true);
    mockBuildPriceWithDeliveryFee.mockReturnValue({
      deliveryFee: { deliveryFeeType: 'FREE' },
      salePrice: 42990,
    });
    mockUpdatePrice.mockResolvedValue({
      salePrice: 42990,
      deliveryInfo: { deliveryFee: { baseFee: 0 } },
    });

    const result = await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(mockBuildPriceWithDeliveryFee).toHaveBeenCalledWith(
      TARGET_PRODUCT.sheet.delivery,
      42990,
    );
    expect(mockUpdatePrice).toHaveBeenCalledWith({
      productNo: TARGET_PRODUCT.originProductNo,
      deliveryFee: { deliveryFeeType: 'FREE' },
      salePrice: 42990,
    });
    expect(result).toEqual({ status: 'updated', salePrice: 42990, baseFee: 0 });
  });

  it('DRY_RUN이 true이면 수정 요청을 보내지 않고 계산한 값을 updated로 반환한다', async () => {
    vi.stubEnv('DRY_RUN', 'true');
    mockGetSellersInPuppeteer.mockResolvedValue(SELLERS);
    mockFilterExcludedSellers.mockReturnValue(FILTERED_SELLERS);
    mockAddVirtualPrice.mockReturnValue([43000]);
    mockCalculateTargetPrice.mockReturnValue(42990);
    mockIsPriceUpdateRequired.mockReturnValue(true);
    mockBuildPriceWithDeliveryFee.mockReturnValue({
      deliveryFee: { deliveryFeeType: 'PAID', deliveryFeePayType: 'PREPAID', baseFee: 3000 },
      salePrice: 39990,
    });

    const result = await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(mockUpdatePrice).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'updated', salePrice: 39990, baseFee: 3000 });
  });

  it('판매처 조회에서 UnexpectedCatalogPageError가 나면 isFatal: true인 error를 반환한다', async () => {
    const error = new UnexpectedCatalogPageError('네이버 쇼핑 접속이 일시적으로 제한되었습니다.');
    mockGetSellersInPuppeteer.mockRejectedValue(error);

    const result = await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(result).toEqual({ status: 'error', error: error.message, isFatal: true });
  });

  it('판매처 조회에서 그 외 에러가 나면 콘솔에 로깅하고 isFatal: false인 error를 반환한다', async () => {
    const error = new Error('네이버 판매처 목록을 가져오지 못했습니다.');
    mockGetSellersInPuppeteer.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    expect(result).toEqual({ status: 'error', error: error.message, isFatal: false });

    consoleErrorSpy.mockRestore();
  });

  it('가격 수정 요청에서 에러가 나면 isFatal: false인 error를 반환한다', async () => {
    mockGetSellersInPuppeteer.mockResolvedValue(SELLERS);
    mockFilterExcludedSellers.mockReturnValue(FILTERED_SELLERS);
    mockAddVirtualPrice.mockReturnValue([43000]);
    mockCalculateTargetPrice.mockReturnValue(42990);
    mockIsPriceUpdateRequired.mockReturnValue(true);
    mockBuildPriceWithDeliveryFee.mockReturnValue({
      deliveryFee: { deliveryFeeType: 'FREE' },
      salePrice: 42990,
    });
    const error = new Error('네이버 상품 가격을 수정하지 못했습니다.');
    mockUpdatePrice.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(result).toEqual({ status: 'error', error: error.message, isFatal: false });

    consoleErrorSpy.mockRestore();
  });

  it('Error가 아닌 값을 던지면 문자열로 변환해 반환한다', async () => {
    mockGetSellersInPuppeteer.mockRejectedValue('알 수 없는 문제');
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await updateTargetProduct(PAGE, TARGET_PRODUCT, MY_STORE_NAME);

    expect(result).toEqual({ status: 'error', error: '알 수 없는 문제', isFatal: false });

    consoleErrorSpy.mockRestore();
  });
});
