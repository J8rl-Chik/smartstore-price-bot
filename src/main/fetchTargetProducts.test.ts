import { afterEach, expect, it, vi } from 'vitest';
import fetchTargetProducts from './fetchTargetProducts';

const mockGetSaleProducts = vi.fn();
const mockGetProductRows = vi.fn();
const mockExcludeNewlyRegisteredProducts = vi.fn();
const mockGetProductName = vi.fn();
const mockGetOriginProductNo = vi.fn();
const mockGetSalePrice = vi.fn();
const mockGetDeliveryFee = vi.fn();
const mockParseProductRow = vi.fn();
const mockFindDuplicateProductNames = vi.fn();
const mockCreateTargetProducts = vi.fn();
const mockShuffleArray = vi.fn();

vi.mock(import('../integrations/smartStore/getSaleProducts'), () => ({
  default: (...args: unknown[]) => mockGetSaleProducts(...args),
}));

vi.mock(import('../integrations/googleSheets/getProductRows'), () => ({
  default: (...args: unknown[]) => mockGetProductRows(...args),
}));

vi.mock(import('../domain/product/saleProduct'), () => ({
  excludeNewlyRegisteredProducts: (...args: unknown[]) =>
    mockExcludeNewlyRegisteredProducts(...args),
  getProductName: (...args: unknown[]) => mockGetProductName(...args),
  getOriginProductNo: (...args: unknown[]) => mockGetOriginProductNo(...args),
  getSalePrice: (...args: unknown[]) => mockGetSalePrice(...args),
  getDeliveryFee: (...args: unknown[]) => mockGetDeliveryFee(...args),
}));

vi.mock(import('../domain/product/parseProductRow'), () => ({
  parseProductRow: (...args: unknown[]) => mockParseProductRow(...args),
}));

vi.mock(import('../domain/product/findDuplicateProductNames'), () => ({
  findDuplicateProductNames: (...args: unknown[]) => mockFindDuplicateProductNames(...args),
}));

vi.mock(import('../domain/product/createTargetProducts'), () => ({
  createTargetProducts: (...args: unknown[]) => mockCreateTargetProducts(...args),
}));

vi.mock(import('../utils/shuffleArray'), () => ({
  default: (...args: unknown[]) => mockShuffleArray(...args),
}));

afterEach(() => {
  mockGetSaleProducts.mockReset();
  mockGetProductRows.mockReset();
  mockExcludeNewlyRegisteredProducts.mockReset();
  mockGetProductName.mockReset();
  mockGetOriginProductNo.mockReset();
  mockGetSalePrice.mockReset();
  mockGetDeliveryFee.mockReset();
  mockParseProductRow.mockReset();
  mockFindDuplicateProductNames.mockReset();
  mockCreateTargetProducts.mockReset();
  mockShuffleArray.mockReset();
});

it('판매 상품과 시트 행을 가공해 합친 목록과 중복된 상품명을 반환한다', async () => {
  const rawSaleProducts = [{ id: 'raw' }];
  const filteredSaleProducts = [{ id: 'filtered' }];
  const shuffledSaleProducts = [{ id: 'shuffled' }];
  const rawProductRows = [['상품A'], ['상품B']];
  const productRow = { name: '상품A' };
  const targetProduct = { name: '상품A', originProductNo: 111 };

  mockGetSaleProducts.mockResolvedValue(rawSaleProducts);
  mockExcludeNewlyRegisteredProducts.mockReturnValue(filteredSaleProducts);
  mockShuffleArray.mockReturnValue(shuffledSaleProducts);
  mockGetProductRows.mockResolvedValue(rawProductRows);
  mockParseProductRow.mockReturnValueOnce({ status: 'ok', productRow }).mockReturnValueOnce({
    status: 'error',
    productRow: { name: '상품B' },
    errorMessages: ['productPrice: 에러'],
  });
  mockFindDuplicateProductNames.mockReturnValue(['상품A']);
  mockCreateTargetProducts.mockReturnValue([targetProduct]);

  const result = await fetchTargetProducts();

  expect(mockExcludeNewlyRegisteredProducts).toHaveBeenCalledWith(rawSaleProducts);
  expect(mockShuffleArray).toHaveBeenCalledWith(filteredSaleProducts);
  // map이 넘기는 인덱스·배열 인자는 관심사가 아니라 첫 번째 인자(행)만 비교한다.
  expect(mockParseProductRow.mock.calls.map(([rowValues]) => rowValues)).toEqual(rawProductRows);
  // 변환에 실패한 행(상품B)은 빼고 성공한 행만 넘긴다.
  expect(mockFindDuplicateProductNames).toHaveBeenCalledWith([productRow]);
  expect(mockCreateTargetProducts).toHaveBeenCalledWith(shuffledSaleProducts, [productRow]);
  expect(result).toMatchObject({
    targetProducts: [targetProduct],
    duplicateProductNames: ['상품A'],
  });
});

it('판매 상품과 시트 행을 동시에 요청한다', () => {
  /**
   * 두 조회를 영원히 끝나지 않는 Promise로 만든 뒤 실행한다.
   * 동시에 요청(Promise.all)하면 한쪽이 끝나지 않아도 두 함수가 모두 호출된다.
   * 순서대로 요청(await를 두 번 나눠 씀)하면 앞의 조회에서 멈춰 뒤의 함수는 호출되지 않는다.
   * 결과는 기다리지 않으므로 void로 호출한다.
   */
  mockGetSaleProducts.mockReturnValue(new Promise(() => {}));
  mockGetProductRows.mockReturnValue(new Promise(() => {}));

  void fetchTargetProducts();

  expect(mockGetSaleProducts).toHaveBeenCalled();
  expect(mockGetProductRows).toHaveBeenCalled();
});

interface FakeSaleProduct {
  name: string;
  originProductNo: number;
  salePrice: number;
  deliveryFee: number;
}

/**
 * 판매 상품을 이름과 스토어 값만 가진 가짜 객체로 정하고, 각 get 함수가 그 값을 돌려주게 한다.
 * 시트 행 하나(상품C)를 변환에 실패한 결과로 정한다.
 */
const mockSaleProductsWithInvalidRow = (saleProducts: FakeSaleProduct[]): void => {
  mockGetSaleProducts.mockResolvedValue([]);
  mockExcludeNewlyRegisteredProducts.mockReturnValue([]);
  mockShuffleArray.mockReturnValue(saleProducts);
  mockGetProductName.mockImplementation(({ name }: FakeSaleProduct) => name);
  mockGetOriginProductNo.mockImplementation(
    ({ originProductNo }: FakeSaleProduct) => originProductNo,
  );
  mockGetSalePrice.mockImplementation(({ salePrice }: FakeSaleProduct) => salePrice);
  mockGetDeliveryFee.mockImplementation(({ deliveryFee }: FakeSaleProduct) => deliveryFee);
  mockGetProductRows.mockResolvedValue([['상품C']]);
  mockParseProductRow.mockReturnValue({
    status: 'error',
    productRow: { name: '상품C', feeType: '유료' },
    errorMessages: ['productPrice: 에러'],
  });
};

it('판매 상품에 이름이 있는 변환 실패 시트 행을 이름이 같은 판매 상품의 스토어 값과 에러 메시지를 담아 반환한다', async () => {
  mockSaleProductsWithInvalidRow([
    { name: '상품A', originProductNo: 111, salePrice: 10000, deliveryFee: 3000 },
    { name: '상품C', originProductNo: 333, salePrice: 30000, deliveryFee: 2500 },
  ]);

  const { invalidProductRows } = await fetchTargetProducts();

  expect(invalidProductRows).toEqual([
    {
      name: '상품C',
      originProductNo: 333,
      store: { salePrice: 30000, deliveryFee: 2500 },
      errorMessages: ['productPrice: 에러'],
    },
  ]);
});

it('판매 상품에 이름이 없는 변환 실패 시트 행은 반환하지 않는다', async () => {
  mockSaleProductsWithInvalidRow([
    { name: '상품A', originProductNo: 111, salePrice: 10000, deliveryFee: 3000 },
  ]);

  const { invalidProductRows } = await fetchTargetProducts();

  expect(invalidProductRows).toEqual([]);
});
