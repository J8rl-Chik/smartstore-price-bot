import { afterEach, describe, expect, it, vi } from 'vitest';
import getSaleProducts from './getSaleProducts.js';
import { type SaleProduct } from '../../domain/product/saleProduct.js';

const mockFetch = vi.fn();
const mockGenerateAccessToken = vi.fn();

vi.mock('node-fetch', () => ({
  default: (...args: unknown[]) => mockFetch(...args),
}));

vi.mock('./generateAccessToken.js', () => ({
  default: (...args: unknown[]) => mockGenerateAccessToken(...args),
}));

const createSaleProduct = (sellerManagementCode?: string): SaleProduct => ({
  channelProducts: [{ name: '상품', originProductNo: 1, sellerManagementCode }],
});

describe('getSaleProducts', () => {
  afterEach(() => {
    mockFetch.mockReset();
    mockGenerateAccessToken.mockReset();
  });

  it('발급받은 accessToken으로 판매 중 상품 목록을 조회해 가공 없이 그대로 반환한다', async () => {
    const existingProduct = createSaleProduct('기존-001');
    const newProduct = createSaleProduct('신규-001');

    mockGenerateAccessToken.mockResolvedValue('token-abc');
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ contents: [existingProduct, newProduct] }),
    });

    // 신규 등록 상품 제외는 domain/saleProduct.js(excludeNewlyRegisteredProducts)의 책임이라
    // getSaleProducts는 필터링 없이 원본 목록을 그대로 반환해야 한다.
    await expect(getSaleProducts()).resolves.toEqual([existingProduct, newProduct]);
  });

  it('상품 검색 API를 올바른 URL/메서드/인증 헤더/바디로 호출한다', async () => {
    mockGenerateAccessToken.mockResolvedValue('token-abc');
    mockFetch.mockResolvedValue({ json: () => Promise.resolve({ contents: [] }) });

    await getSaleProducts();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.commerce.naver.com/external/v1/products/search',
      {
        method: 'POST',
        headers: {
          Authorization: 'token-abc',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productStatusTypes: ['SALE'], size: 500 }),
      },
    );
  });

  it('accessToken 발급이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const tokenError = new Error('토큰 발급 실패');

    mockGenerateAccessToken.mockRejectedValue(tokenError);

    await expect(getSaleProducts()).rejects.toMatchObject({
      message: '네이버 판매 상품 목록을 가져오지 못했습니다.',
      cause: tokenError,
    });
  });

  it('상품 검색 요청이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const networkError = new Error('네트워크 오류');

    mockFetch.mockRejectedValue(networkError);
    mockGenerateAccessToken.mockResolvedValue('token-abc');

    await expect(getSaleProducts()).rejects.toMatchObject({
      message: '네이버 판매 상품 목록을 가져오지 못했습니다.',
      cause: networkError,
    });
  });

  it('응답 파싱이 실패해도 원인을 보존한 채 에러를 던진다', async () => {
    const parseError = new Error('잘못된 JSON');

    mockFetch.mockResolvedValue({ json: () => Promise.reject(parseError) });
    mockGenerateAccessToken.mockResolvedValue('token-abc');

    await expect(getSaleProducts()).rejects.toMatchObject({
      message: '네이버 판매 상품 목록을 가져오지 못했습니다.',
      cause: parseError,
    });
  });

  it('응답에 message가 있으면(네이버 쪽 조회 실패) 원인을 보존한 채 에러를 던진다', async () => {
    mockGenerateAccessToken.mockResolvedValue('token-abc');
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve({ message: '유효하지 않은 요청입니다.' }),
    });

    await expect(getSaleProducts()).rejects.toMatchObject({
      message: '네이버 판매 상품 목록을 가져오지 못했습니다.',
      cause: expect.objectContaining({ message: '유효하지 않은 요청입니다.' }),
    });
  });
});
