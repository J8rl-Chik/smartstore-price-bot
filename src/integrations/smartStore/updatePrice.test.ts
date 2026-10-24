import { afterEach, expect, it, vi } from 'vitest';
import updatePrice, { type ProductResult } from './updatePrice.js';
import { ERROR_MESSAGE } from '../../domain/error/errorMessage.js';

const mockFetch = vi.fn();
const mockGenerateAccessToken = vi.fn();

vi.mock('node-fetch', () => ({
  default: (...args: unknown[]) => mockFetch(...args),
}));

vi.mock('./generateAccessToken.js', () => ({
  default: (...args: unknown[]) => mockGenerateAccessToken(...args),
}));

const createOriginProductResult = (override: Record<string, unknown> = {}): ProductResult => ({
  originProduct: {
    name: '기존 상품',
    detailContent: '<div>상세페이지</div>',
    stockQuantity: 100,
    deliveryInfo: { deliveryFee: { deliveryFeeType: 'PAID', baseFee: 2500 } },
    ...override,
  },
  smartstoreChannelProduct: { channelProductNo: 1 },
  windowChannelProduct: null,
});

afterEach(() => {
  mockFetch.mockReset();
  mockGenerateAccessToken.mockReset();
});

it('가격 수정 API의 응답을 그대로 반환한다', async () => {
  const updateResult = {
    salePrice: 50000,
    deliveryInfo: { deliveryFee: { baseFee: 3000 } },
  };

  mockGenerateAccessToken.mockResolvedValue('token-abc');
  mockFetch
    .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResult()) })
    .mockResolvedValueOnce({ json: () => Promise.resolve(updateResult) });

  await expect(
    updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
  ).resolves.toEqual(updateResult);
});

it('상품 조회는 GET, 가격 수정은 PUT으로 같은 상품 URL에 인증 헤더를 담아 요청한다', async () => {
  const productURL = 'https://api.commerce.naver.com/external/v2/products/origin-products/123';

  mockGenerateAccessToken.mockResolvedValue('token-abc');
  mockFetch
    .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResult()) })
    .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) });

  await updatePrice({
    productNo: 123,
    deliveryFee: { deliveryFeeType: 'FREE' },
    salePrice: 50000,
  });

  expect(mockFetch).toHaveBeenCalledTimes(2);

  const [getURL, getOption] = mockFetch.mock.calls[0] as [
    string,
    { method: string; headers: Record<string, string> },
  ];
  const [putURL, putOption] = mockFetch.mock.calls[1] as [
    string,
    { method: string; headers: Record<string, string> },
  ];

  expect(getURL).toBe(productURL);
  expect(getOption.method).toBe('GET');
  expect(getOption.headers.Authorization).toBe('token-abc');
  expect(putURL).toBe(productURL);
  expect(putOption.method).toBe('PUT');
  expect(putOption.headers.Authorization).toBe('token-abc');
});

it('detailContent/stockQuantity는 제거하고 salePrice를 반영해 수정 요청을 보낸다', async () => {
  mockGenerateAccessToken.mockResolvedValue('token-abc');
  mockFetch
    .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResult()) })
    .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) });

  await updatePrice({
    productNo: 123,
    deliveryFee: { deliveryFeeType: 'FREE' },
    salePrice: 50000,
  });

  const [, putOption] = mockFetch.mock.calls[1] as [string, { body: string }];
  const putBody = JSON.parse(putOption.body);

  expect(putBody.originProduct.detailContent).toBeUndefined();
  expect(putBody.originProduct.stockQuantity).toBeUndefined();
  expect(putBody.originProduct.name).toBe('기존 상품');
  expect(putBody.originProduct.salePrice).toBe(50000);
  expect(putBody.smartstoreChannelProduct).toEqual({ channelProductNo: 1 });
});

it('원본 배송 정보와 배송비는 유지하고, 수정할 배송비와 지역별 차등 배송비를 덮어써 수정 요청을 보낸다', async () => {
  const originDeliveryInfo = {
    deliveryType: 'DELIVERY',
    deliveryFee: {
      deliveryFeeType: 'PAID',
      deliveryFeePayType: 'PREPAID',
      baseFee: 2500,
      deliveryFeeByArea: { deliveryAreaType: 'AREA_2', area2extraFee: 5000 },
    },
  };

  mockGenerateAccessToken.mockResolvedValue('token-abc');
  mockFetch
    .mockResolvedValueOnce({
      json: () => Promise.resolve(createOriginProductResult({ deliveryInfo: originDeliveryInfo })),
    })
    .mockResolvedValueOnce({ json: () => Promise.resolve({ success: true }) });

  await updatePrice({
    productNo: 123,
    deliveryFee: { deliveryFeeType: 'PAID', deliveryFeePayType: 'PREPAID', baseFee: 3000 },
    salePrice: 50000,
  });

  const [, putOption] = mockFetch.mock.calls[1] as [string, { body: string }];
  const putBody = JSON.parse(putOption.body);

  expect(putBody.originProduct.deliveryInfo).toEqual({
    deliveryType: 'DELIVERY',
    deliveryFee: {
      deliveryFeeType: 'PAID',
      deliveryFeePayType: 'PREPAID',
      baseFee: 3000,
      deliveryFeeByArea: { deliveryAreaType: 'AREA_2', area2extraFee: 5000 },
      differentialFeeByArea: '3000',
    },
  });
});

it('accessToken 발급이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
  const tokenError = new Error('토큰 발급 실패');
  mockGenerateAccessToken.mockRejectedValue(tokenError);

  await expect(
    updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
  ).rejects.toMatchObject({
    message: ERROR_MESSAGE.PRICE_UPDATE_FAILED,
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
    message: ERROR_MESSAGE.PRICE_UPDATE_FAILED,
    cause: readError,
  });
});

it('가격 수정(PUT) 요청이 실패하면 원인을 보존한 채 에러를 던진다', async () => {
  mockGenerateAccessToken.mockResolvedValue('token-abc');
  const updateError = new Error('수정 실패');
  mockFetch
    .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResult()) })
    .mockRejectedValueOnce(updateError);

  await expect(
    updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
  ).rejects.toMatchObject({
    message: ERROR_MESSAGE.PRICE_UPDATE_FAILED,
    cause: updateError,
  });
});

it('수정 응답에 message가 있으면(네이버 쪽 업데이트 실패) 원인을 보존한 채 에러를 던진다', async () => {
  mockGenerateAccessToken.mockResolvedValue('token-abc');
  mockFetch
    .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResult()) })
    .mockResolvedValueOnce({
      json: () => Promise.resolve({ message: '유효하지 않은 상품입니다.' }),
    });

  await expect(
    updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
  ).rejects.toMatchObject({
    message: ERROR_MESSAGE.PRICE_UPDATE_FAILED,
    cause: expect.objectContaining({ message: '유효하지 않은 상품입니다.' }),
  });
});

it('응답 파싱이 실패해도 원인을 보존한 채 에러를 던진다', async () => {
  mockGenerateAccessToken.mockResolvedValue('token-abc');
  const parseError = new Error('잘못된 JSON');
  mockFetch
    .mockResolvedValueOnce({ json: () => Promise.resolve(createOriginProductResult()) })
    .mockResolvedValueOnce({ json: () => Promise.reject(parseError) });

  await expect(
    updatePrice({ productNo: 123, deliveryFee: { deliveryFeeType: 'FREE' }, salePrice: 50000 }),
  ).rejects.toMatchObject({
    message: ERROR_MESSAGE.PRICE_UPDATE_FAILED,
    cause: parseError,
  });
});
