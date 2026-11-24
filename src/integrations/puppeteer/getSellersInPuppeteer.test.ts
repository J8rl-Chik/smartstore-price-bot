import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import getSellersInPuppeteer, {
  goToCatalog,
  getSellerItemTexts,
  createReferer,
  SELLER_ITEM_SELECTOR,
} from './getSellersInPuppeteer.js';
import { UnexpectedCatalogPageError } from './validateCatalogPage.js';
import { collectSellerItemTexts, type SellerItemTexts } from './parseSellerItem.js';
import { DELIVERY_FEE_TYPE } from '../../domain/delivery/_constant.js';
import type { Seller } from '../../domain/seller/_type.js';
import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';

const mockValidateCatalogPage = vi.fn();

vi.mock('./validateCatalogPage.js', async () => {
  const originalModule = await vi.importActual('./validateCatalogPage.js');

  return {
    ...originalModule,
    default: (...args: unknown[]) => mockValidateCatalogPage(...args),
  };
});

const mockParseSellerItem = vi.fn();

vi.mock(import('./parseSellerItem.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  default: (...args: unknown[]) => mockParseSellerItem(...args),
}));

afterEach(() => {
  mockValidateCatalogPage.mockReset();
  mockParseSellerItem.mockReset();
});

describe('goToCatalog', () => {
  const catalogUrl = 'https://example.com/catalog';

  const createMockPage = () => ({
    goto: vi.fn(),
  });

  it('catalogURL로 이동하면서 referer를 함께 넘긴다', async () => {
    const mockPage = createMockPage();
    const referer = 'https://search.shopping.naver.com/search/all?query=상품';

    await goToCatalog(mockPage as unknown as Page, catalogUrl, referer);

    expect(mockPage.goto).toHaveBeenCalledTimes(1);
    expect(mockPage.goto).toHaveBeenCalledWith(catalogUrl, { referer });
  });

  it('goto가 실패하면 에러를 그대로 전파한다', async () => {
    const mockPage = createMockPage();
    const gotoError = new Error('네트워크 오류');

    mockPage.goto.mockRejectedValue(gotoError);

    await expect(
      goToCatalog(mockPage as unknown as Page, catalogUrl, 'https://referer.example'),
    ).rejects.toThrow(gotoError);
  });
});

describe('createReferer', () => {
  it('제품명의 괄호는 별도로 인코딩해(%28, %29) referer에 반영한다', async () => {
    const productName = '이어폰(블랙)';

    expect(createReferer(productName)).toBe(
      'https://search.shopping.naver.com/search/all?query=%EC%9D%B4%EC%96%B4%ED%8F%B0%28%EB%B8%94%EB%9E%99%29&vertical=search',
    );
  });
});

describe('getSellerItemTexts', () => {
  const catalogUrl = 'https://example.com/catalog';
  const referer = `https://search.shopping.naver.com/search/all?query=productName&vertical=search`;

  const createMockPage = (sellerItemTexts: SellerItemTexts[] = []) => ({
    goto: vi.fn(),
    evaluate: vi.fn().mockResolvedValue(sellerItemTexts),
  });

  it('goToCatalog 함수에 catalogURL과 referer를 전달해 catalogURL로 이동한다', async () => {
    const mockPage = createMockPage();

    await getSellerItemTexts(mockPage as unknown as Page, catalogUrl, referer);

    expect(mockPage.goto).toHaveBeenCalledWith(catalogUrl, { referer });
  });

  it('이동한 뒤에 카탈로그 페이지인지 validateCatalogPage 함수로 검증한다', async () => {
    const mockPage = createMockPage();

    await getSellerItemTexts(mockPage as unknown as Page, catalogUrl, referer);

    expect(mockValidateCatalogPage).toHaveBeenCalledTimes(1);
    expect(mockValidateCatalogPage).toHaveBeenCalledWith(mockPage);

    // 이동 전에 검증하면 이전 페이지를 검사하게 되므로 순서가 중요하다.
    const [gotoOrder] = mockPage.goto.mock.invocationCallOrder;
    const [validateOrder] = mockValidateCatalogPage.mock.invocationCallOrder;
    expect(gotoOrder).toBeLessThan(validateOrder as number);
  });

  it('카탈로그 페이지가 아니면 판매처 데이터를 수집하지 않고 에러를 던진다.', async () => {
    const mockPage = createMockPage();
    const validateError = new UnexpectedCatalogPageError('접속 제한');

    mockValidateCatalogPage.mockRejectedValue(validateError);

    await expect(
      getSellerItemTexts(mockPage as unknown as Page, catalogUrl, referer),
    ).rejects.toThrow(validateError);
    expect(mockPage.evaluate).not.toHaveBeenCalled();
  });

  const sellerItemTexts: SellerItemTexts[] = [
    { name: '판매처1', price: '1,000', discountPrice: null, delivery: '무료배송' },
    { name: '판매처2', price: '2,000', discountPrice: '1,800', delivery: '2,500원 포함' },
  ];

  it('카탈로그 페이지면 SELLER_ITEM_SELECTOR로 collectSellerItemTexts를 브라우저에서 실행해 그 결과를 반환한다', async () => {
    const mockPage = createMockPage(sellerItemTexts);
    const result = await getSellerItemTexts(mockPage as unknown as Page, catalogUrl, referer);

    expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
    expect(mockPage.evaluate).toHaveBeenCalledWith(collectSellerItemTexts, SELLER_ITEM_SELECTOR);
    expect(result).toEqual(sellerItemTexts);
  });
});

describe('getSellersInPuppeteer', () => {
  const catalogUrl = 'https://example.com/catalog';
  const productName = '제품';

  const createMockPage = (sellerItemTexts: SellerItemTexts[] = []) => ({
    goto: vi.fn(),
    evaluate: vi.fn().mockResolvedValue(sellerItemTexts),
  });

  const createSellerItemTexts = (name: string): SellerItemTexts => ({
    name,
    price: '1,000',
    discountPrice: null,
    delivery: '무료배송',
  });

  const createSeller = (name: string): Seller => ({
    name,
    price: 1000,
    deliveryFee: 0,
    deliveryFeeType: DELIVERY_FEE_TYPE.FREE,
  });

  it('수집한 텍스트를 parseSellerItem으로 변환한 뒤 하나의 배열로 합친다', async () => {
    const sellerItem1Texts = createSellerItemTexts('판매처1');
    const sellerItem2Texts = createSellerItemTexts('판매처2');
    const mockPage = createMockPage([sellerItem1Texts, sellerItem2Texts]);
    const seller1 = createSeller('판매처1');
    const seller2 = createSeller('판매처2');
    const seller2Discounted = createSeller('판매처2');

    mockParseSellerItem
      .mockReturnValueOnce([seller1])
      .mockReturnValueOnce([seller2, seller2Discounted]);

    const result = await getSellersInPuppeteer(
      mockPage as unknown as Page,
      catalogUrl,
      productName,
    );

    expect(mockParseSellerItem.mock.calls[0]?.[0]).toBe(sellerItem1Texts);
    expect(mockParseSellerItem.mock.calls[1]?.[0]).toBe(sellerItem2Texts);
    expect(result).toEqual([seller1, seller2, seller2Discounted]);
  });

  it('판매처 항목이 없으면 parseSellerItem을 호출하지 않고 빈 배열을 반환한다', async () => {
    const mockPage = createMockPage([]);
    const result = await getSellersInPuppeteer(
      mockPage as unknown as Page,
      catalogUrl,
      productName,
    );

    expect(result).toEqual([]);
    expect(mockParseSellerItem).not.toHaveBeenCalled();
  });

  it('페이지 이동이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const mockPage = createMockPage();
    const gotoError = new Error('네트워크 오류');
    mockPage.goto.mockRejectedValue(gotoError);

    await expect(
      getSellersInPuppeteer(mockPage as unknown as Page, catalogUrl, productName),
    ).rejects.toMatchObject({
      message: ERROR_MESSAGE.SELLERS_FETCH_FAILED,
      cause: gotoError,
    });
  });

  it('parseSellerItem이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const mockPage = createMockPage([createSellerItemTexts('판매처1')]);
    const parseError = new Error('파싱 실패');

    mockParseSellerItem.mockImplementation(() => {
      throw parseError;
    });

    await expect(
      getSellersInPuppeteer(mockPage as unknown as Page, catalogUrl, productName),
    ).rejects.toMatchObject({
      message: ERROR_MESSAGE.SELLERS_FETCH_FAILED,
      cause: parseError,
    });
  });
  // 호출하는 쪽은 findErrorInCause로 cause를 따라가 UnexpectedCatalogPageError를 구분한다.
  it('카탈로그 검증 에러(UnexpectedCatalogPageError)도 cause에 담아 감싸서 던진다', async () => {
    const mockPage = createMockPage();
    const catalogError = new UnexpectedCatalogPageError('접속 제한');

    mockValidateCatalogPage.mockRejectedValue(catalogError);

    await expect(
      getSellersInPuppeteer(mockPage as unknown as Page, catalogUrl, productName),
    ).rejects.toMatchObject({
      message: ERROR_MESSAGE.SELLERS_FETCH_FAILED,
      cause: catalogError,
    });
  });

  it('카탈로그 검증 중 그 외 에러가 나면 원인을 보존한 채 감싸서 던진다', async () => {
    const mockPage = createMockPage();
    const evaluateError = new Error('Execution context was destroyed');

    mockValidateCatalogPage.mockRejectedValue(evaluateError);

    await expect(
      getSellersInPuppeteer(mockPage as unknown as Page, catalogUrl, productName),
    ).rejects.toMatchObject({
      message: ERROR_MESSAGE.SELLERS_FETCH_FAILED,
      cause: evaluateError,
    });
  });
});
