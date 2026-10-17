import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useTargetProductsUpdate from './useTargetProductsUpdate';
import type { TargetProduct, UpdateState } from '../../../domain/product/_type';
import type { IpcEvent } from '../../../preload/_type';

const mockCreateLoginPage = vi.fn<IpcEvent['createLoginPage']>();
const mockGetTargetProducts = vi.fn<IpcEvent['getTargetProducts']>();
const mockStartUpdate = vi.fn<IpcEvent['startUpdate']>();
// onUpdateState에 전달된 콜백(= 훅의 setUpdateState)을 꺼내 와, main이 push하는 상황을 흉내 낸다.
const mockOnUpdateState = vi.fn<(callback: (state: UpdateState) => void) => () => void>();
const mockUnsubscribe = vi.fn();

const createTargetProduct = (originProductNo: number, name: string): TargetProduct => ({
  name,
  originProductNo,
  store: { salePrice: 42900, stockQuantity: 10, deliveryFee: 0 },
  sheet: {
    catalogURL: `https://catalog.example/${originProductNo}`,
    delivery: { feeType: '무료' },
    freeDeliveryPrice: 0,
    productPrice: 42900,
    virtualPrice: null,
    excludedSellerNames: [],
  },
});

const FIRST_PRODUCT = createTargetProduct(1, '무선 이어폰 프로');
const SECOND_PRODUCT = createTargetProduct(2, '블루투스 스피커 미니');

const mockTargetProducts = (targetProducts: TargetProduct[]): void => {
  mockGetTargetProducts.mockResolvedValue({
    isSuccess: true,
    targetProducts,
    duplicateProductNames: [],
  });
};

// main이 updateState를 push한 것처럼, onUpdateState에 전달된 콜백을 직접 호출한다.
const pushUpdateState = (state: UpdateState): void => {
  const callback = mockOnUpdateState.mock.calls.at(-1)?.[0];

  if (!callback) {
    throw new Error('onUpdateState가 호출되지 않았습니다.');
  }

  callback(state);
};

window.api = {
  createLoginPage: mockCreateLoginPage,
  getTargetProducts: mockGetTargetProducts,
  startUpdate: mockStartUpdate,
  onUpdateState: mockOnUpdateState,
};

beforeEach(() => {
  vi.resetAllMocks();

  mockCreateLoginPage.mockResolvedValue(undefined);
  mockStartUpdate.mockResolvedValue(undefined);
  mockOnUpdateState.mockReturnValue(mockUnsubscribe);
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

test('렌더링하면 updateState를 구독한다', async () => {
  await renderHook(() => useTargetProductsUpdate());

  expect(mockOnUpdateState).toHaveBeenCalledOnce();
});

test('언마운트하면 updateState 구독을 해제한다', async () => {
  const { unmount } = await renderHook(() => useTargetProductsUpdate());

  await unmount();

  expect(mockUnsubscribe).toHaveBeenCalledOnce();
});

test('start를 호출하면 가져온 상품 목록을 wait 상태로 targetProducts에 먼저 반영한다', async () => {
  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(result.current.targetProducts).toEqual([
    { ...FIRST_PRODUCT, update: { status: 'wait' } },
    { ...SECOND_PRODUCT, update: { status: 'wait' } },
  ]);
});

test('상품이 있으면 로그인 페이지를 만들고 가져온 상품 목록으로 순회를 시작한다', async () => {
  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockCreateLoginPage).toHaveBeenCalledOnce();
  expect(mockStartUpdate).toHaveBeenCalledWith([FIRST_PRODUCT, SECOND_PRODUCT]);
});

test('상품이 없으면 로그인 페이지를 만들지 않고 순회를 시작하지 않는다', async () => {
  mockTargetProducts([]);

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  expect(mockCreateLoginPage).not.toHaveBeenCalled();
  expect(mockStartUpdate).not.toHaveBeenCalled();
});

test('start를 호출하면 상품 목록을 가져오는 동안 isLoading이 true이고 끝나면 false이다', async () => {
  // 테스트에서 getTargetProducts의 대기를 직접 풀 수 있도록 풀어주는 함수를 담아 둘 변수이다.
  let resolveGetTargetProducts!: () => void;

  mockGetTargetProducts.mockReturnValue(
    new Promise((resolve) => {
      resolveGetTargetProducts = () =>
        resolve({ isSuccess: true, targetProducts: [], duplicateProductNames: [] });
    }),
  );
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  let startPromise!: Promise<void>;

  await act(() => {
    startPromise = result.current.start();
  });

  expect(result.current.isLoading).toBe(true);

  await act(async () => {
    resolveGetTargetProducts();
    await startPromise;
  });

  expect(result.current.isLoading).toBe(false);
});

test('main이 push한 updateState를 그대로 targetProducts에 반영한다', async () => {
  mockTargetProducts([FIRST_PRODUCT]);
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  await act(() => {
    pushUpdateState({
      targetProducts: [
        {
          ...FIRST_PRODUCT,
          update: { status: 'complete', price: 39900, baseFee: 3000, updatedAt: 1 },
        },
      ],
      currentIndex: null,
      isRunning: false,
    });
  });

  expect(result.current.targetProducts).toEqual([
    { ...FIRST_PRODUCT, update: { status: 'complete', price: 39900, baseFee: 3000, updatedAt: 1 } },
  ]);
});

test('main이 push한 currentIndex로 현재 상품과 순서를 알려준다', async () => {
  mockTargetProducts([FIRST_PRODUCT, SECOND_PRODUCT]);
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  await act(() => {
    pushUpdateState({
      targetProducts: [
        { ...FIRST_PRODUCT, update: { status: 'wait' } },
        { ...SECOND_PRODUCT, update: { status: 'wait' } },
      ],
      currentIndex: 1,
      isRunning: true,
    });
  });

  expect(result.current.currentOrder).toBe(2);
  expect(result.current.currentProduct).toMatchObject(SECOND_PRODUCT);
});

test('currentIndex가 null이면 현재 상품과 순서가 없다', async () => {
  mockTargetProducts([FIRST_PRODUCT]);
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.start());

  await act(() => {
    pushUpdateState({
      targetProducts: [{ ...FIRST_PRODUCT, update: { status: 'wait' } }],
      currentIndex: null,
      isRunning: false,
    });
  });

  expect(result.current.currentOrder).toBe(0);
  expect(result.current.currentProduct).toBeUndefined();
});
