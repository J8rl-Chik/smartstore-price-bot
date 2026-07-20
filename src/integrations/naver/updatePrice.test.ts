import { afterEach, describe, expect, it, vi } from 'vitest';
import updatePrice from './updatePrice.js';

const mockFetch = vi.fn();
const mockGenerateAccessToken = vi.fn();

vi.mock('node-fetch', () => ({
  default: (...args: unknown[]) => mockFetch(...args),
}));

vi.mock('./generateAccessToken.js', () => ({
  default: (...args: unknown[]) => mockGenerateAccessToken(...args),
}));

const createOriginProductResponse = (overrides: Record<string, unknown> = {}) => ({
  originProduct: {
    name: '기존 상품',
    detailContent: '<div>상세페이지</div>',
    stockQuantity: 100,
    deliveryInfo: { deliveryFeeType: 'FREE' },
    ...overrides,
  },
  smartstoreChannelProduct: { channelProductNo: 1 },
  windowChannelProduct: null,
});

const PRODUCT_URL = 'https://api.commerce.naver.com/external/v2/products/origin-products/123';

describe('updatePrice', () => {
  afterEach(() => {
    mockFetch.mockReset();
    mockGenerateAccessToken.mockReset();
  });

  it('가격 수정 API의 응답을 그대로 반환한다', async () => {
    mockGenerateAccessToken.mockResolvedValue('token-abc');
    const updateResult = { success: true, productNo: 123 };
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResponse()) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(updateResult) });

    await expect(
      updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
    ).resolves.toEqual(updateResult);
  });

  it('상품 조회는 GET, 가격 수정은 PUT으로 같은 상품 URL에 인증 헤더를 담아 요청한다', async () => {
    mockGenerateAccessToken.mockResolvedValue('token-abc');
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResponse()) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) });

    await updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 });

    expect(mockFetch).toHaveBeenCalledTimes(2);

    const [getUrl, getOptions] = mockFetch.mock.calls[0] as [
      string,
      { method: string; headers: Record<string, string> },
    ];
    const [putUrl, putOptions] = mockFetch.mock.calls[1] as [
      string,
      { method: string; headers: Record<string, string> },
    ];

    expect(getUrl).toBe(PRODUCT_URL);
    expect(getOptions.method).toBe('GET');
    expect(getOptions.headers.Authorization).toBe('token-abc');
    expect(putUrl).toBe(PRODUCT_URL);
    expect(putOptions.method).toBe('PUT');
    expect(putOptions.headers.Authorization).toBe('token-abc');
  });

  it('detailContent/stockQuantity는 제거하고 deliveryFee/salePrice를 반영해 수정 요청을 보낸다', async () => {
    mockGenerateAccessToken.mockResolvedValue('token-abc');
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResponse()) })
      .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) });

    await updatePrice({
      productNo: 123,
      deliveryFee: { deliveryFeeType: 'FREE' },
      salePrice: 50000,
    });

    const [, putOptions] = mockFetch.mock.calls[1] as [string, { body: string }];
    const putBody = JSON.parse(putOptions.body);

    expect(putBody.originProduct.detailContent).toBeUndefined();
    expect(putBody.originProduct.stockQuantity).toBeUndefined();
    expect(putBody.originProduct.name).toBe('기존 상품');
    // 기존 deliveryInfo 값은 그대로 유지한 채, deliveryFee 객체 전체를 하위 필드로 중첩해 덮어쓴다(의도된 동작).
    expect(putBody.originProduct.deliveryInfo).toEqual({
      deliveryFeeType: 'FREE',
      deliveryFee: { deliveryFeeType: 'FREE' },
    });
    expect(putBody.originProduct.salePrice).toBe(50000);
    expect(putBody.smartstoreChannelProduct).toEqual({ channelProductNo: 1 });
  });

  it('accessToken 발급이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    const tokenError = new Error('토큰 발급 실패');
    mockGenerateAccessToken.mockRejectedValue(tokenError);

    await expect(
      updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
    ).rejects.toMatchObject({
      message: '네이버 상품 가격을 수정하지 못했습니다.',
      cause: tokenError,
    });
  });

  it('원본 상품 조회(GET)가 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    mockGenerateAccessToken.mockResolvedValue('token-abc');
    const readError = new Error('조회 실패');
    mockFetch.mockRejectedValueOnce(readError);

    await expect(
      updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
    ).rejects.toMatchObject({
      message: '네이버 상품 가격을 수정하지 못했습니다.',
      cause: readError,
    });
  });

  it('가격 수정(PUT) 요청이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
    mockGenerateAccessToken.mockResolvedValue('token-abc');
    const updateError = new Error('수정 실패');
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResponse()) })
      .mockRejectedValueOnce(updateError);

    await expect(
      updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
    ).rejects.toMatchObject({
      message: '네이버 상품 가격을 수정하지 못했습니다.',
      cause: updateError,
    });
  });

  it('수정 응답에 message가 있으면(네이버 쪽 업데이트 실패) 원인을 보존한 채 에러를 던진다', async () => {
    mockGenerateAccessToken.mockResolvedValue('token-abc');
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResponse()) })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ message: '유효하지 않은 상품입니다.' }),
      });

    await expect(
      updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
    ).rejects.toMatchObject({
      message: '네이버 상품 가격을 수정하지 못했습니다.',
      cause: expect.objectContaining({ message: '유효하지 않은 상품입니다.' }),
    });
  });

  it('응답 파싱이 실패해도 원인을 보존한 채 에러를 던진다', async () => {
    mockGenerateAccessToken.mockResolvedValue('token-abc');
    const parseError = new Error('잘못된 JSON');
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResponse()) })
      .mockResolvedValueOnce({ json: () => Promise.reject(parseError) });

    await expect(
      updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
    ).rejects.toMatchObject({
      message: '네이버 상품 가격을 수정하지 못했습니다.',
      cause: parseError,
    });
  });
});
