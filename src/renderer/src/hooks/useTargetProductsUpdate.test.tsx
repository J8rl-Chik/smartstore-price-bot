import { beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useTargetProductsUpdate from './useTargetProductsUpdate';
import type { TargetProduct } from '../../../domain/product/_type';
import type { IpcEvent } from '../../../preload/_type';

const { mockDelaySeconds } = vi.hoisted(() => ({ mockDelaySeconds: vi.fn() }));

vi.mock(import('../../../utils/delaySeconds'), () => ({
  default: mockDelaySeconds,
}));

const mockCreateLoginPage = vi.fn<IpcEvent['createLoginPage']>();
const mockGetTargetProducts = vi.fn<IpcEvent['getTargetProducts']>();
const mockGetSellers = vi.fn<IpcEvent['getSellers']>();

const createTargetProduct = (overrides: Partial<TargetProduct> = {}): TargetProduct => ({
  name: '무선 이어폰 프로',
  originProductNo: 1,
  catalogURL: 'https://catalog.example/1',
  feeType: '무료',
  freeDeliveryPrice: 0,
  productPrice: 42900,
  baseFee: 0,
  virtualPrice: null,
  excludedSellerNames: [],
  ...overrides,
});

const FIRST_PRODUCT = createTargetProduct();
const SECOND_PRODUCT = createTargetProduct({
  name: '블루투스 스피커 미니',
  originProductNo: 2,
  catalogURL: 'https://catalog.example/2',
});

const mockTargetProducts = (targetProducts: TargetProduct[]): void => {
  mockGetTargetProducts.mockResolvedValue({
    isSuccess: true,
    targetProducts,
    duplicateProductNames: [],
  });
};

beforeEach(() => {
  vi.resetAllMocks();
  // 훅이 가져온 상품 목록을 console.log로 출력하므로 테스트 출력이 지저분해지지 않게 막는다.
  vi.spyOn(console, 'log').mockImplementation(() => {});

  mockDelaySeconds.mockResolvedValue(undefined);
  mockCreateLoginPage.mockResolvedValue(undefined);
  mockGetSellers.mockResolvedValue({ isSuccess: true, sellers: [] });

  window.api = {
    createLoginPage: mockCreateLoginPage,
    getTargetProducts: mockGetTargetProducts,
    getSellers: mockGetSellers,
  };
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

  expect(result.current.targetProducts).toEqual([FIRST_PRODUCT, SECOND_PRODUCT]);
});

test('act 없이 start를 호출하면 상품 목록을 가져오는 동안 isLoading이 true이고 끝나면 false이다', async () => {
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
  const { result } = await renderHook(() => useTargetProductsUpdate());

  /**
   * act 없이 start를 호출한다. setIsLoading(true)를 호출하고 getTargetProducts에서 대기하며 멈춘다.
   * start는 아직 끝나지 않았으므로 Promise만 변수에 받아 두고 나중에 await한다.
   */
  const startPromise = result.current.start();

  // setIsLoading(true)의 렌더링은 act 없이는 시점을 알 수 없어서, isLoading이 true로 보일 때까지 반복 확인한다.
  await vi.waitFor(() => expect(result.current.isLoading).toBe(true));

  // 대기 중이던 Promise를 끝낸다. start가 이어서 실행되어 setIsLoading(false)를 호출하고 상품이 없어 return한다.
  resolveGetTargetProducts();
  // start 함수가 끝날 때까지 기다린다. 보장되는 건 함수의 종료뿐이고 React의 렌더링 완료는 아니다.
  await startPromise;

  // 렌더링이 아직이면 이전 값 true로 읽히므로, isLoading이 false로 렌더링될 때까지 반복 확인한다.
  await vi.waitFor(() => expect(result.current.isLoading).toBe(false));
});

test('act로 감싼 start가 끝나면 isLoading이 false이다', async () => {
  mockTargetProducts([]);
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(result.current.isLoading).toBe(false);
});

// test('상품이 없으면 로그인 페이지를 만들지 않는다', async () => {
//   mockTargetProducts([]);
//   const { result, act } = await renderHook(() => useTargetProductsUpdate());

//   await act(() => result.current.start());

//   expect(mockCreateLoginPage).not.toHaveBeenCalled();
//   expect(mockGetSellers).not.toHaveBeenCalled();
// });

// test('상품이 있으면 로그인 페이지를 만들고 상품마다 판매처를 가져온다', async () => {
//   mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
//   const { result, act } = await renderHook(() => useTargetProductsUpdate());

//   await act(() => result.current.start());

//   expect(mockCreateLoginPage).toHaveBeenCalledOnce();
//   expect(mockGetSellers).toHaveBeenCalledTimes(2);
//   expect(mockGetSellers).toHaveBeenNthCalledWith(1, FIRST_PRODUCT.catalogURL, FIRST_PRODUCT.name);
//   expect(mockGetSellers).toHaveBeenNthCalledWith(2, SECOND_PRODUCT.catalogURL, SECOND_PRODUCT.name);
// });

// test('판매처를 가져오는 데 실패하면 나머지 상품을 순회하지 않는다', async () => {
//   mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
//   mockGetSellers.mockResolvedValueOnce({ isSuccess: false, error: '실패' });
//   const { result, act } = await renderHook(() => useTargetProductsUpdate());

//   await act(() => result.current.start());

//   expect(mockGetSellers).toHaveBeenCalledOnce();
// });

// test('순회 중에는 현재 상품과 순서를 알려주고, 끝나면 초기화한다', async () => {
//   mockTargetProducts([FIRST_PRODUCT]);
//   let finishDelay!: () => void;
//   mockDelaySeconds.mockReturnValue(
//     new Promise<void>((resolve) => {
//       finishDelay = resolve;
//     }),
//   );
//   const { result, act } = await renderHook(() => useTargetProductsUpdate());

//   const startPromise = act(() => result.current.start());

//   await vi.waitFor(() => expect(result.current.currentOrder).toBe(1));
//   expect(result.current.currentProduct).toEqual(FIRST_PRODUCT);

//   finishDelay();
//   await startPromise;

//   expect(result.current.currentOrder).toBe(0);
//   expect(result.current.currentProduct).toBeUndefined();
// });

// test('순회 중 에러가 나도 진행 상태를 초기화한다', async () => {
//   mockTargetProducts([FIRST_PRODUCT]);
//   mockGetSellers.mockRejectedValue(new Error('브라우저 종료'));
//   const { result, act } = await renderHook(() => useTargetProductsUpdate());

//   await expect(act(() => result.current.start())).rejects.toThrow('브라우저 종료');

//   expect(result.current.currentOrder).toBe(0);
//   expect(result.current.currentProduct).toBeUndefined();
// });
