import { beforeEach, expect, test, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import useTargetProductsUpdate from './useTargetProductsUpdate';
import type {
  TargetProduct,
  TargetProductWithUpdate,
  UpdateState,
} from '../../../domain/product/_type';
import type { IpcInvoke, IpcListener } from '../../../preload/_type';

const mockStartUpdate = vi.fn<IpcInvoke['startUpdate']>();
const mockOnUpdateState = vi.fn<IpcListener['onUpdateState']>();
const mockUnsubscribe = vi.fn();

window.api = {
  startUpdate: mockStartUpdate,
  onUpdateState: mockOnUpdateState,
};

beforeEach(() => {
  vi.resetAllMocks();

  mockStartUpdate.mockResolvedValue({ status: 'done' });
  mockOnUpdateState.mockReturnValue(mockUnsubscribe);
});

test('처음에는 상품과 진행 상태가 비어 있다', async () => {
  const { result } = await renderHook(() => useTargetProductsUpdate());

  expect(result.current.targetProducts).toEqual([]);
  expect(result.current.invalidProductRows).toEqual([]);
  expect(result.current.isPreparing).toBe(false);
  expect(result.current.currentProduct).toBeUndefined();
  expect(result.current.currentOrder).toBe(0);
  expect(result.current.startUpdateErrorMessage).toBeNull();
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

test('main이 보낸 상태의 상품 목록을 targetProducts에 반영한다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => {
    emitUpdateState({
      targetProducts: [firstProduct, secondProduct],
      invalidProductRows: [],
      currentIndex: null,
      isPreparing: false,
      isRunning: true,
    });
  });

  expect(result.current.targetProducts).toEqual([firstProduct, secondProduct]);
});

test('main이 보낸 상태의 변환에 실패한 시트 행을 invalidProductRows에 반영한다', async () => {
  const invalidProductRows = [{ name: '무선 충전기', errorMessages: ['productPrice: 에러'] }];
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => {
    emitUpdateState({
      targetProducts: [firstProduct],
      invalidProductRows,
      currentIndex: null,
      isPreparing: false,
      isRunning: true,
    });
  });

  expect(result.current.invalidProductRows).toEqual(invalidProductRows);
});

test('main이 보낸 상태의 currentIndex로 현재 상품과 순서를 알려준다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => {
    emitUpdateState({
      targetProducts: [firstProduct, secondProduct],
      invalidProductRows: [],
      currentIndex: 1,
      isPreparing: false,
      isRunning: true,
    });
  });

  expect(result.current.currentOrder).toBe(2);
  expect(result.current.currentProduct).toEqual(secondProduct);
});

test('main이 보낸 상태의 currentIndex가 null이면 현재 상품과 순서를 초기화한다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => {
    emitUpdateState({
      targetProducts: [firstProduct],
      invalidProductRows: [],
      currentIndex: 0,
      isPreparing: false,
      isRunning: true,
    });
  });

  await act(() => {
    emitUpdateState({
      targetProducts: [firstProduct],
      invalidProductRows: [],
      currentIndex: null,
      isPreparing: false,
      isRunning: false,
    });
  });

  expect(result.current.currentOrder).toBe(0);
  expect(result.current.currentProduct).toBeUndefined();
});

test('main이 보낸 상태의 isPreparing을 그대로 알려준다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => {
    emitUpdateState({
      targetProducts: [],
      invalidProductRows: [],
      currentIndex: null,
      isPreparing: true,
      isRunning: false,
    });
  });

  expect(result.current.isPreparing).toBe(true);
});

test('main이 보낸 상태의 isPreparing이 false로 바뀌면 isPreparing도 false로 바뀐다', async () => {
  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => {
    emitUpdateState({
      targetProducts: [],
      invalidProductRows: [],
      currentIndex: null,
      isPreparing: true,
      isRunning: false,
    });
  });

  await act(() => {
    emitUpdateState({
      targetProducts: [firstProduct],
      invalidProductRows: [],
      currentIndex: null,
      isPreparing: false,
      isRunning: true,
    });
  });

  expect(result.current.isPreparing).toBe(false);
});

test('window.api.startUpdate가 error 결과를 돌려주면 그 메시지를 startUpdateErrorMessage에 담는다', async () => {
  mockStartUpdate.mockResolvedValue({ status: 'error', message: '네이버 로그인에 실패했습니다.' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.startUpdate());

  expect(result.current.startUpdateErrorMessage).toBe('네이버 로그인에 실패했습니다.');
});

test('window.api.startUpdate가 running 결과를 돌려주면 startUpdateErrorMessage는 null이다', async () => {
  mockStartUpdate.mockResolvedValue({ status: 'running' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.startUpdate());

  expect(result.current.startUpdateErrorMessage).toBeNull();
});

test('실패한 뒤 다시 시작해 done 결과를 받으면 이전 실패 이유를 지운다', async () => {
  mockStartUpdate
    .mockResolvedValueOnce({ status: 'error', message: '네이버 로그인에 실패했습니다.' })
    .mockResolvedValueOnce({ status: 'done' });

  const { result, act } = await renderHook(() => useTargetProductsUpdate());

  await act(() => result.current.startUpdate());
  await act(() => result.current.startUpdate());

  expect(result.current.startUpdateErrorMessage).toBeNull();
});
