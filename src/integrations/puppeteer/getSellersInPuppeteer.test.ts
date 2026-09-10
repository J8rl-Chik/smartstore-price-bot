import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import getSellersInPuppeteer, { SELLER_ITEM_SELECTOR } from './getSellersInPuppeteer.js';
import { DELIVERY_FEE_TYPE } from '../../domain/delivery/delivery.js';
import { Seller } from '../../domain/seller/filterExcludedSellers.js';

const mockParseSellerItem = vi.fn();

vi.mock(import('./parseSellerItem.js'), () => ({
  default: (...args: unknown[]) => mockParseSellerItem(...args),
}));

const createMockPage = (itemsHTML: string[] = []) => ({
  goto: vi.fn(),
  evaluate: vi.fn().mockResolvedValue(itemsHTML),
});

const createSeller = (name: string): Seller => ({
  name,
  price: 1000,
  deliveryFee: 0,
  deliveryFeeType: DELIVERY_FEE_TYPE.FREE,
});

describe('getSellersInPuppeteer', () => {
  afterEach(() => {
    mockParseSellerItem.mockReset();
  });

  it('네이버 쇼핑 검색 결과 페이지를 거쳐 catalogUrl로 이동한다', async () => {
    const mockPage = createMockPage();
    const productName = '무선 이어폰';
    const expectedReferer = `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(productName)}&vertical=search`;

    await getSellersInPuppeteer(
      mockPage as unknown as Page,
      'https://example.com/catalog',
      productName,
    );

    expect(mockPage.goto).toHaveBeenNthCalledWith(1, expectedReferer, {
      referer: 'https://search.shopping.naver.com/home',
    });
    expect(mockPage.goto).toHaveBeenNthCalledWith(2, 'https://example.com/catalog', {
      referer: expectedReferer,
    });
  });

  it('제품명의 괄호는 별도로 인코딩해(%28, %29) 검색 referer에 반영한다', async () => {
    const mockPage = createMockPage();

    await getSellersInPuppeteer(
      mockPage as unknown as Page,
      'https://example.com/catalog',
      '이어폰(블랙)',
    );

    const [refererURL] = mockPage.goto.mock.calls[0] as [string];

    expect(refererURL).toBe(
      'https://search.shopping.naver.com/search/all?query=%EC%9D%B4%EC%96%B4%ED%8F%B0%28%EB%B8%94%EB%9E%99%29&vertical=search',
    );
  });

  it('SELLER_ITEM_SELECTOR로 판매처 항목의 outerHTML을 수집해 parseSellerItem으로 변환한 뒤 하나의 배열로 합친다', async () => {
    const itemsHTML = ['<div>item1</div>', '<div>item2</div>'];
    const mockPage = createMockPage(itemsHTML);
    const seller1 = createSeller('판매처1');
    const seller2 = createSeller('판매처2');
    const seller2Discounted = createSeller('판매처2');

    mockParseSellerItem
      .mockReturnValueOnce([seller1])
      .mockReturnValueOnce([seller2, seller2Discounted]);

    const result = await getSellersInPuppeteer(
      mockPage as unknown as Page,
      'https://example.com/catalog',
      '상품',
    );

    expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), SELLER_ITEM_SELECTOR);
    expect(mockParseSellerItem.mock.calls[0]?.[0]).toBe('<div>item1</div>');
    expect(mockParseSellerItem.mock.calls[1]?.[0]).toBe('<div>item2</div>');
    expect(result).toEqual([seller1, seller2, seller2Discounted]);
  });

  it('판매처 항목이 없으면 빈 배열을 반환한다', async () => {
    const mockPage = createMockPage([]);
    const result = await getSellersInPuppeteer(
      mockPage as unknown as Page,
      'https://example.com/catalog',
      '상품',
    );

    expect(result).toEqual([]);
    expect(mockParseSellerItem).not.toHaveBeenCalled();
  });

  it('페이지 이동이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const mockPage = createMockPage();
    const gotoError = new Error('네트워크 오류');

    mockPage.goto.mockRejectedValue(gotoError);

    await expect(
      getSellersInPuppeteer(mockPage as unknown as Page, 'https://example.com/catalog', '상품'),
    ).rejects.toMatchObject({
      message: '네이버 판매처 목록을 가져오지 못했습니다.',
      cause: gotoError,
    });
  });

  it('parseSellerItem이 실패해도 원인을 보존한 채 에러를 던진다', async () => {
    const mockPage = createMockPage(['<div>item1</div>']);
    const parseError = new Error('파싱 실패');

    mockParseSellerItem.mockImplementation(() => {
      throw parseError;
    });

    await expect(
      getSellersInPuppeteer(mockPage as unknown as Page, 'https://example.com/catalog', '상품'),
    ).rejects.toMatchObject({
      message: '네이버 판매처 목록을 가져오지 못했습니다.',
      cause: parseError,
    });
  });
});
