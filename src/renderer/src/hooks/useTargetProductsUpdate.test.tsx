import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useTargetProductsUpdate from './useTargetProductsUpdate';
import type { TargetProduct } from '../../../domain/product/_type';
import type { Seller } from '../../../domain/seller/filterExcludedSellers';
import type { IpcEvent } from '../../../preload/_type';

const { mockDelaySeconds } = vi.hoisted(() => ({ mockDelaySeconds: vi.fn() }));

vi.mock(import('../../../utils/delaySeconds'), () => ({
  default: mockDelaySeconds,
}));

const mockCreateLoginPage = vi.fn<IpcEvent['createLoginPage']>();
const mockGetTargetProducts = vi.fn<IpcEvent['getTargetProducts']>();
const mockGetSellers = vi.fn<IpcEvent['getSellers']>();
const mockFilterSellers = vi.fn<IpcEvent['filterSellers']>();
const mockGetTargetPrice = vi.fn<IpcEvent['getTargetPrice']>();
const mockUpdatePrice = vi.fn<IpcEvent['updatePrice']>();

const SELLERS: Seller[] = [
  { name: '판매처A', price: 42000, deliveryFee: 0, deliveryFeeType: '무료' },
  { name: '판매처B', price: 43000, deliveryFee: 3000, deliveryFeeType: '유료' },
];
const FILTERED_SELLERS: Seller[] = [SELLERS[1]];

interface TargetProductOverrides extends Partial<Pick<TargetProduct, 'name' | 'originProductNo'>> {
  sheet?: Partial<TargetProduct['sheet']>;
}

const createTargetProduct = ({
  sheet,
  ...overrides
}: TargetProductOverrides = {}): TargetProduct => ({
  name: '무선 이어폰 프로',
  originProductNo: 1,
  store: {
    salePrice: 42900,
    stockQuantity: 10,
    deliveryFee: 0,
  },
  sheet: {
    catalogURL: 'https://catalog.example/1',
    delivery: { feeType: '무료' },
    freeDeliveryPrice: 0,
    productPrice: 42900,
    virtualPrice: null,
    excludedSellerNames: [],
    ...sheet,
  },
  ...overrides,
});

const FIRST_PRODUCT = createTargetProduct();
const SECOND_PRODUCT = createTargetProduct({
  name: '블루투스 스피커 미니',
  originProductNo: 2,
  sheet: { catalogURL: 'https://catalog.example/2' },
});

const mockTargetProducts = (targetProducts: TargetProduct[]): void => {
  mockGetTargetProducts.mockResolvedValue({
    isSuccess: true,
    targetProducts,
    duplicateProductNames: [],
  });
};

window.api = {
  createLoginPage: mockCreateLoginPage,
  getTargetProducts: mockGetTargetProducts,
  getSellers: mockGetSellers,
  filterSellers: mockFilterSellers,
  getTargetPrice: mockGetTargetPrice,
  updatePrice: mockUpdatePrice,
};

beforeEach(() => {
  vi.resetAllMocks();

  mockDelaySeconds.mockResolvedValue(undefined);
  mockCreateLoginPage.mockResolvedValue(undefined);
  mockGetSellers.mockResolvedValue({ isSuccess: true, sellers: [] });
  mockFilterSellers.mockResolvedValue({ isSuccess: true, sellers: [] });
  mockGetTargetPrice.mockResolvedValue({ isSuccess: true, targetPrice: 42900 });
  mockUpdatePrice.mockResolvedValue({ isSuccess: true, salePrice: 42900, baseFee: 0 });
});

afterEach(() => {
  vi.useRealTimers();
});

test('처음에는 상품과 진행 상태가 비어 있다', async () => {
  const { result } = await renderHook(() => useTargetProductsUpdate());

  expect(result.current.targetProducts).toEqual([]);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.currentProduct).toBeUndefined();
  expect(result.current.currentOrder).toBe(0);
});

test('start를 호출하면 가져온 상품 목록을 targetProducts에 저장한다', async () => {
  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(result.current.targetProducts.map(({ name }) => name)).toEqual([
    FIRST_PRODUCT.name,
    SECOND_PRODUCT.name,
  ]);
});

test('가격 수정에 성공하면 해당 상품에 수정 판매가, 기본 배송비, 수정 시간을 done 상태로 반영한다', async () => {
  const updatedAt = new Date('2026-10-14T14:32:05');

  // Date만 가짜로 바꿔 수정 시간을 고정한다. delaySeconds는 목이라 타이머는 건드리지 않는다.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(updatedAt);
  mockTargetProducts([FIRST_PRODUCT]);
  mockUpdatePrice.mockResolvedValue({ isSuccess: true, salePrice: 39900, baseFee: 3000 });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(result.current.targetProducts).toEqual([
    {
      ...FIRST_PRODUCT,
      update: { status: 'done', price: 39900, baseFee: 3000, updatedAt: updatedAt.getTime() },
    },
  ]);
});

test('아직 처리하지 않은 상품은 wait 상태이다', async () => {
  let finishDelay!: () => void;

  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
  mockDelaySeconds.mockReturnValue(
    new Promise<void>((resolve) => {
      finishDelay = resolve;
    }),
  );

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  // act가 끝난 뒤에도 start의 Promise를 쓸 수 있도록 act 바깥에 선언해 둔다.
  let startPromise!: Promise<void>;

  // 첫 상품을 처리하고 delaySeconds의 대기 지점에서 멈춘 상태를 만든다.
  await act(() => {
    startPromise = result.current.start();
  });

  expect(result.current.targetProducts.map(({ update }) => update.status)).toEqual([
    'done',
    'wait',
  ]);

  await act(async () => {
    finishDelay();

    await startPromise;
  });
});

test('start를 호출하면 상품 목록을 가져오는 동안 isLoading이 true이고 끝나면 false이다', async () => {
  // 테스트에서 getTargetProducts의 대기를 직접 풀 수 있도록 풀어주는 함수를 담아 둘 변수이다.
  let resolveGetTargetProducts!: () => void;

  /**
   * resolve가 불리기 전까지 끝나지 않는 Promise를 반환해서 getTargetProducts 호출을 대기 상태로 멈춘다.
   * 바로 끝나는 mockResolvedValue를 쓰면 isLoading이 true인 구간을 관찰할 수 없다.
   */
  mockGetTargetProducts.mockReturnValue(
    new Promise((resolve) => {
      // resolve를 호출하는 함수를 바깥 변수에 저장만 한다. 아직 호출하지 않으므로 Promise는 대기 중이다.
      resolveGetTargetProducts = () =>
        resolve({ isSuccess: true, targetProducts: [], duplicateProductNames: [] });
    }),
  );
  // 훅을 렌더링한다. 이 시점의 isLoading은 초기값 false이다.
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  // act가 끝난 뒤에도 start의 Promise를 쓸 수 있도록 act 바깥에 선언해 둔다.
  let startPromise!: Promise<void>;

  /**
   * act 안에서 start를 호출한다. setIsLoading(true)를 호출하고 getTargetProducts에서 대기하며 멈춘다.
   * 콜백이 start의 Promise를 반환하면 act가 그 Promise를 기다리며 멈추므로, 블록 본문으로 쓰고 Promise는 변수에 받아 둔다.
   */
  await act(() => {
    startPromise = result.current.start();
  });

  // act가 끝나면 쌓여 있던 상태 변경이 렌더링되므로, 바로 isLoading이 true로 읽힌다.
  expect(result.current.isLoading).toBe(true);

  /**
   * 대기 중이던 Promise를 끝낸다. start가 이어서 실행되어 setIsLoading(false)를 호출하고 상품이 없어 return한다.
   * act는 start가 끝나기를 기다린 뒤 상태 변경을 렌더링하고 반환한다.
   */
  await act(async () => {
    resolveGetTargetProducts();
    await startPromise;
  });

  // act가 렌더링까지 끝내고 반환했으므로, 바로 isLoading이 false로 읽힌다.
  expect(result.current.isLoading).toBe(false);
});

test('act로 감싼 start가 끝나면 isLoading이 false이다', async () => {
  mockTargetProducts([]);

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(result.current.isLoading).toBe(false);
});

test('상품이 없으면 로그인 페이지를 만들지 않는다', async () => {
  mockTargetProducts([]);

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockCreateLoginPage).not.toHaveBeenCalled();
  expect(mockGetSellers).not.toHaveBeenCalled();
});

test('상품이 있으면 로그인 페이지를 만들고 상품마다 판매처를 가져온다', async () => {
  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockCreateLoginPage).toHaveBeenCalledOnce();
  expect(mockGetSellers).toHaveBeenCalledTimes(2);
  expect(mockGetSellers).toHaveBeenNthCalledWith(
    1,
    FIRST_PRODUCT.sheet.catalogURL,
    FIRST_PRODUCT.name,
  );
  expect(mockGetSellers).toHaveBeenNthCalledWith(
    2,
    SECOND_PRODUCT.sheet.catalogURL,
    SECOND_PRODUCT.name,
  );
});

test('판매처를 가져오는 데 실패하면 나머지 상품을 순회하지 않는다', async () => {
  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
  mockGetSellers.mockResolvedValueOnce({ isSuccess: false, error: '실패' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockGetSellers).toHaveBeenCalledOnce();
  expect(mockDelaySeconds).not.toHaveBeenCalledOnce();
});

test('판매처를 가져오면 판매처와 상품의 제외 판매처로 필터링을 요청한다', async () => {
  const firstProduct = createTargetProduct({ sheet: { excludedSellerNames: ['판매처A'] } });
  const secondProduct = createTargetProduct({
    originProductNo: 2,
    sheet: { excludedSellerNames: ['판매처B', '판매처C'] },
  });

  mockTargetProducts([firstProduct, secondProduct]);
  mockGetSellers.mockResolvedValue({ isSuccess: true, sellers: SELLERS });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockFilterSellers).toHaveBeenCalledTimes(2);
  expect(mockFilterSellers).toHaveBeenNthCalledWith(1, SELLERS, ['판매처A']);
  expect(mockFilterSellers).toHaveBeenNthCalledWith(2, SELLERS, ['판매처B', '판매처C']);
});

test('판매처를 가져오는 데 실패하면 필터링을 요청하지 않는다', async () => {
  mockTargetProducts([FIRST_PRODUCT]);
  mockGetSellers.mockResolvedValueOnce({ isSuccess: false, error: '실패' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockFilterSellers).not.toHaveBeenCalled();
});

test('판매처 필터링에 실패하면 나머지 상품을 순회하지 않는다', async () => {
  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
  mockFilterSellers.mockResolvedValueOnce({ isSuccess: false, error: '실패' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockGetSellers).toHaveBeenCalledOnce();
  expect(mockFilterSellers).toHaveBeenCalledOnce();
  expect(mockDelaySeconds).not.toHaveBeenCalled();
});

test('필터링한 판매처의 가격과 상품의 무료배송 기준가로 목표 가격을 요청한다', async () => {
  const firstProduct = createTargetProduct({ sheet: { freeDeliveryPrice: 30000 } });
  const secondProduct = createTargetProduct({
    originProductNo: 2,
    sheet: { freeDeliveryPrice: 50000 },
  });

  mockTargetProducts([firstProduct, secondProduct]);
  mockFilterSellers.mockResolvedValue({ isSuccess: true, sellers: FILTERED_SELLERS });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockGetTargetPrice).toHaveBeenCalledTimes(2);
  expect(mockGetTargetPrice).toHaveBeenNthCalledWith(1, [43000], 30000);
  expect(mockGetTargetPrice).toHaveBeenNthCalledWith(2, [43000], 50000);
});

test('가상 가격이 있으면 판매처 가격 뒤에 더해 목표 가격을 요청한다', async () => {
  mockTargetProducts([createTargetProduct({ sheet: { virtualPrice: 41000 } })]);
  mockFilterSellers.mockResolvedValue({ isSuccess: true, sellers: FILTERED_SELLERS });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockGetTargetPrice).toHaveBeenCalledWith([43000, 41000], 0);
});

test('가상 가격이 없으면 판매처 가격만으로 목표 가격을 요청한다', async () => {
  mockTargetProducts([createTargetProduct({ sheet: { virtualPrice: null } })]);
  mockFilterSellers.mockResolvedValue({ isSuccess: true, sellers: FILTERED_SELLERS });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockGetTargetPrice).toHaveBeenCalledWith([43000], 0);
});

test('판매처 필터링에 실패하면 목표 가격을 요청하지 않는다', async () => {
  mockTargetProducts([FIRST_PRODUCT]);
  mockFilterSellers.mockResolvedValueOnce({ isSuccess: false, error: '실패' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockGetTargetPrice).not.toHaveBeenCalled();
});

test('목표 가격을 가져오는 데 실패하면 나머지 상품을 순회하지 않는다', async () => {
  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
  mockGetTargetPrice.mockResolvedValueOnce({ isSuccess: false, error: '실패' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockGetSellers).toHaveBeenCalledOnce();
  expect(mockGetTargetPrice).toHaveBeenCalledOnce();
  expect(mockDelaySeconds).not.toHaveBeenCalled();
});

test('목표 가격과 상품의 배송비 설정으로 가격 수정을 요청한다', async () => {
  const firstProduct = createTargetProduct({
    originProductNo: 1,
    sheet: { delivery: { feeType: '유료', baseFee: 3000 } },
  });
  const secondProduct = createTargetProduct({
    originProductNo: 2,
    sheet: { delivery: { feeType: '무료' } },
  });

  mockTargetProducts([firstProduct, secondProduct]);
  mockGetTargetPrice
    .mockResolvedValueOnce({ isSuccess: true, targetPrice: 42900 })
    .mockResolvedValueOnce({ isSuccess: true, targetPrice: 51000 });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockUpdatePrice).toHaveBeenCalledTimes(2);
  expect(mockUpdatePrice).toHaveBeenNthCalledWith(1, 1, 42900, { feeType: '유료', baseFee: 3000 });
  expect(mockUpdatePrice).toHaveBeenNthCalledWith(2, 2, 51000, { feeType: '무료' });
});

test('목표 가격을 가져오는 데 실패하면 가격 수정을 요청하지 않는다', async () => {
  mockTargetProducts([FIRST_PRODUCT]);
  mockGetTargetPrice.mockResolvedValueOnce({ isSuccess: false, error: '실패' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockUpdatePrice).not.toHaveBeenCalled();
});

test('가격 수정에 실패하면 나머지 상품을 순회하지 않는다', async () => {
  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
  mockUpdatePrice.mockResolvedValueOnce({ isSuccess: false, error: '실패' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockGetSellers).toHaveBeenCalledOnce();
  expect(mockUpdatePrice).toHaveBeenCalledOnce();
  expect(mockDelaySeconds).not.toHaveBeenCalled();
});

test('순회 중에는 현재 상품과 순서를 알려주고, 끝나면 초기화한다', async () => {
  let finishDelay!: () => void;

  mockTargetProducts([FIRST_PRODUCT]);
  mockDelaySeconds.mockReturnValue(
    new Promise<void>((resolve) => {
      finishDelay = resolve;
    }),
  );

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  // act가 끝난 뒤에도 start의 Promise를 쓸 수 있도록 act 바깥에 선언해 둔다.
  let startPromise!: Promise<void>;

  /**
   * start를 시작만 시키고 act를 끝낸다. 목 함수들은 바로 끝나므로 start는 delaySeconds의 대기 지점까지 진행하고, act가 그 순회 중 상태를 렌더링한다.
   * 콜백이 start의 Promise를 반환하면 act가 delaySeconds의 대기가 끝나기를 기다리며 멈추므로, 블록 본문으로 쓴다.
   */
  await act(() => {
    startPromise = result.current.start();
  });

  expect(result.current.currentOrder).toBe(1);
  expect(result.current.currentProduct).toMatchObject(FIRST_PRODUCT);

  await act(async () => {
    finishDelay();

    await startPromise;
  });

  expect(result.current.currentOrder).toBe(0);
  expect(result.current.currentProduct).toBeUndefined();
});

test('순회 중 에러가 나도 진행 상태를 초기화한다', async () => {
  mockTargetProducts([FIRST_PRODUCT]);
  mockGetSellers.mockRejectedValue(new Error('브라우저 종료'));

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await expect(act(() => result.current.start())).rejects.toThrow('브라우저 종료');

  expect(result.current.currentOrder).toBe(0);
  expect(result.current.currentProduct).toBeUndefined();
});
