import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import getSellersInPuppeteer, {
  goToCatalog,
  getSellerItemHTMLList,
  createReferer,
  SELLER_ITEM_SELECTOR,
} from './getSellersInPuppeteer.js';
import { UnexpectedCatalogPageError } from './validateCatalogPage.js';
import { DELIVERY_FEE_TYPE } from '../../domain/delivery/delivery.js';
import { Seller } from '../../domain/seller/filterExcludedSellers.js';

const mockValidateCatalogPage = vi.fn();

vi.mock('./validateCatalogPage.js', async () => {
  const originalModule = await vi.importActual('./validateCatalogPage.js');

  return {
    ...originalModule,
    default: (...args: unknown[]) => mockValidateCatalogPage(...args),
  };
});

const mockParseSellerItem = vi.fn();

vi.mock(import('./parseSellerItem.js'), () => ({
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

describe('getSellerItemHTMLList', () => {
  const catalogUrl = 'https://example.com/catalog';
  const referer = `https://search.shopping.naver.com/search/all?query=productName&vertical=search`;

  const createMockPage = (htmlList: string[] = []) => ({
    goto: vi.fn(),
    evaluate: vi.fn().mockResolvedValue(htmlList),
  });

  it('goToCatalog 함수에 catalogURL과 referer를 전달해 catalogURL로 이동한다', async () => {
    const mockPage = createMockPage();

    await getSellerItemHTMLList(mockPage as unknown as Page, catalogUrl, referer);

    expect(mockPage.goto).toHaveBeenCalledWith(catalogUrl, { referer });
  });

  it('이동한 뒤에 카탈로그 페이지인지 validateCatalogPage 함수로 검증한다', async () => {
    const mockPage = createMockPage();

    await getSellerItemHTMLList(mockPage as unknown as Page, catalogUrl, referer);

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
      getSellerItemHTMLList(mockPage as unknown as Page, catalogUrl, referer),
    ).rejects.toThrow(validateError);
    expect(mockPage.evaluate).not.toHaveBeenCalled();
  });

  it('카탈로그 페이지면 SELLER_ITEM_SELECTOR로 판매처 항목의 outerHTML 배열을 반환한다', async () => {
    const itemsHTML = ['<div>item1</div>', '<div>item2</div>'];
    const mockPage = createMockPage(itemsHTML);
    const result = await getSellerItemHTMLList(mockPage as unknown as Page, catalogUrl, referer);

    expect(mockPage.evaluate).toHaveBeenCalledTimes(1);
    expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), SELLER_ITEM_SELECTOR);
    expect(result).toEqual(itemsHTML);
  });
});

describe('getSellersInPuppeteer', () => {
  const catalogUrl = 'https://example.com/catalog';
  const productName = '제품';

  const createMockPage = (htmlList: string[] = []) => ({
    goto: vi.fn(),
    evaluate: vi.fn().mockResolvedValue(htmlList),
  });

  const createSeller = (name: string): Seller => ({
    name,
    price: 1000,
    deliveryFee: 0,
    deliveryFeeType: DELIVERY_FEE_TYPE.FREE,
  });

  it('수집한 HTML을 parseSellerItem으로 변환한 뒤 하나의 배열로 합친다', async () => {
    const mockPage = createMockPage([
      '<div>판매처1 관련 데이터</div>',
      '<div>판매처2 관련 데이터</div>',
    ]);
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

    expect(mockParseSellerItem.mock.calls[0]?.[0]).toBe('<div>판매처1 관련 데이터</div>');
    expect(mockParseSellerItem.mock.calls[1]?.[0]).toBe('<div>판매처2 관련 데이터</div>');
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
      message: '네이버 판매처 목록을 가져오지 못했습니다.',
      cause: gotoError,
    });
  });

  it('parseSellerItem이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const mockPage = createMockPage(['<div>item1</div>']);
    const parseError = new Error('파싱 실패');

    mockParseSellerItem.mockImplementation(() => {
      throw parseError;
    });

    await expect(
      getSellersInPuppeteer(mockPage as unknown as Page, catalogUrl, productName),
    ).rejects.toMatchObject({
      message: '네이버 판매처 목록을 가져오지 못했습니다.',
      cause: parseError,
    });
  });
  /**
   * UnexpectedCatalogPageError는 프로그램을 중단시켜야 하는 에러라 감싸면 안 된다.
   * app.ts가 instanceof로 이 에러를 구분해 상품 단위 skip 대신 실행을 멈춘다.
   */
  it('카탈로그 검증 에러(UnexpectedCatalogPageError)는 감싸지 않고 그대로 전파한다', async () => {
    const mockPage = createMockPage();
    const catalogError = new UnexpectedCatalogPageError('접속 제한');

    mockValidateCatalogPage.mockRejectedValue(catalogError);

    await expect(
      getSellersInPuppeteer(mockPage as unknown as Page, catalogUrl, productName),
    ).rejects.toThrow(catalogError);
  });

  it('카탈로그 검증 중 그 외 에러가 나면 원인을 보존한 채 감싸서 던진다', async () => {
    const mockPage = createMockPage();
    const evaluateError = new Error('Execution context was destroyed');

    mockValidateCatalogPage.mockRejectedValue(evaluateError);

    await expect(
      getSellersInPuppeteer(mockPage as unknown as Page, catalogUrl, productName),
    ).rejects.toMatchObject({
      message: '네이버 판매처 목록을 가져오지 못했습니다.',
      cause: evaluateError,
    });
  });
});
