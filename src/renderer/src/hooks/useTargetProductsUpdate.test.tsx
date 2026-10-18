import { beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useTargetProductsUpdate from './useTargetProductsUpdate';
import type {
  TargetProduct,
  TargetProductWithUpdate,
  UpdateState,
} from '../../../domain/product/_type';
import type { IpcEvent, IpcListener } from '../../../preload/_type';

const mockStartUpdate = vi.fn<IpcEvent['startUpdate']>();
const mockOnUpdateState = vi.fn<IpcListener['onUpdateState']>();
const mockUnsubscribe = vi.fn();

const createTargetProduct = (
  overrides: Partial<Pick<TargetProduct, 'name' | 'originProductNo'>> = {},
): TargetProductWithUpdate => ({
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
  },
  update: { status: 'wait' },
  ...overrides,
});

const firstProduct = createTargetProduct();
const secondProduct = createTargetProduct({ name: '블루투스 스피커 미니', originProductNo: 2 });

// 훅이 onUpdateState에 등록한 callback을 꺼내, main이 상태를 보낸 것처럼 호출한다.
const emitUpdateState = (state: UpdateState): void => {
  const [callback] = mockOnUpdateState.mock.calls[0];

  callback(state);
};

window.api = {
  startUpdate: mockStartUpdate,
  onUpdateState: mockOnUpdateState,
};

beforeEach(() => {
  vi.resetAllMocks();

  mockStartUpdate.mockResolvedValue(undefined);
  mockOnUpdateState.mockReturnValue(mockUnsubscribe);
});

test('처음에는 상품과 진행 상태가 비어 있다', async () => {
  const { result } = await renderHook(() => useTargetProductsUpdate());

  expect(result.current.targetProducts).toEqual([]);
  expect(result.current.isLoading).toBe(false);
  expect(result.current.currentProduct).toBeUndefined();
  expect(result.current.currentOrder).toBe(0);
});

test('렌더링하면 updateState 구독을 등록하고, 언마운트하면 해제한다', async () => {
  const { unmount } = await renderHook(() => useTargetProductsUpdate());

  expect(mockOnUpdateState).toHaveBeenCalledOnce();
  expect(mockUnsubscribe).not.toHaveBeenCalled();

  await unmount();

  expect(mockUnsubscribe).toHaveBeenCalledOnce();
});

test('startUpdate를 호출하면 window.api.startUpdate를 호출한다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.startUpdate());

  expect(mockStartUpdate).toHaveBeenCalledOnce();
});

test('main이 보낸 상태의 상품 목록을 targetProducts에 반영한다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => {
    emitUpdateState({
      targetProducts: [firstProduct, secondProduct],
      currentIndex: null,
      isRunning: true,
    });
  });

  expect(result.current.targetProducts).toEqual([firstProduct, secondProduct]);
});

test('main이 보낸 상태의 currentIndex로 현재 상품과 순서를 알려준다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => {
    emitUpdateState({
      targetProducts: [firstProduct, secondProduct],
      currentIndex: 1,
      isRunning: true,
    });
  });

  expect(result.current.currentOrder).toBe(2);
  expect(result.current.currentProduct).toEqual(secondProduct);
});

test('main이 보낸 상태의 currentIndex가 null이면 현재 상품과 순서를 초기화한다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => {
    emitUpdateState({ targetProducts: [firstProduct], currentIndex: 0, isRunning: true });
  });

  await act(() => {
    emitUpdateState({ targetProducts: [firstProduct], currentIndex: null, isRunning: false });
  });

  expect(result.current.currentOrder).toBe(0);
  expect(result.current.currentProduct).toBeUndefined();
});

test('startUpdate를 호출하면 첫 상태를 받기 전까지 isLoading이 true이고, 받으면 false이다', async () => {
  // 순회가 끝나지 않은 상태를 만들기 위해 window.api.startUpdate를 끝나지 않게 둔다.
  mockStartUpdate.mockReturnValue(new Promise(() => {}));

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  /**
   * 콜백이 startUpdate의 Promise를 반환하면 act가 끝나지 않는 Promise를 기다리며 멈추므로,
   * 블록 본문으로 써서 startUpdate를 시작만 시킨다.
   */
  await act(() => {
    void result.current.startUpdate();
  });

  expect(result.current.isLoading).toBe(true);

  await act(() => {
    emitUpdateState({ targetProducts: [firstProduct], currentIndex: null, isRunning: true });
  });

  expect(result.current.isLoading).toBe(false);
});

test('상태를 받지 못하고 window.api.startUpdate가 끝나도 isLoading이 false이다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.startUpdate());

  expect(result.current.isLoading).toBe(false);
});
