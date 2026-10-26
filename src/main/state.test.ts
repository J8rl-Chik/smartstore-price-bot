import { afterEach, expect, it, vi } from 'vitest';
import type { WebContents } from 'electron';
import { createStateSender } from './state';
import type { TargetProductWithUpdate, UpdateState } from '../domain/product/_type';

const mockSend = vi.fn();

// 상태를 보내는 send만 가진 가짜 sender
const fakeSender = { send: mockSend } as unknown as WebContents;

afterEach(() => {
  mockSend.mockReset();
});

const getSentStates = (): UpdateState[] => mockSend.mock.calls.map(([, state]) => state);

it('sendState는 만들 때 넘긴 sender의 updateState 채널로 상태를 보낸다', () => {
  const { sendState } = createStateSender(fakeSender);

  sendState({});

  expect(mockSend).toHaveBeenCalledWith('updateState', expect.any(Object));
});

it('sendState를 처음 호출하면 빈 초기 상태에 넘긴 값만 덮어쓴 상태 전체를 보낸다', () => {
  const { sendState } = createStateSender(fakeSender);

  sendState({ isPreparing: true });

  expect(getSentStates()).toEqual([
    {
      targetProducts: [],
      invalidProductRows: [],
      currentIndex: null,
      isPreparing: true,
      isRunning: false,
    },
  ]);
});

const productA: TargetProductWithUpdate = {
  name: '상품A',
  originProductNo: 111,
  store: { salePrice: 45000, stockQuantity: 10, deliveryFee: 3000 },
  sheet: {
    catalogURL: 'https://search.shopping.naver.com/catalog/111',
    virtualPrice: 44000,
    freeDeliveryPrice: 40000,
    productPrice: 30000,
    excludedSellerNames: ['제외 스토어'],
    delivery: { feeType: '유료', baseFee: 3000 },
  },
  update: { status: 'wait' },
};

it('sendState는 넘기지 않은 값을 이전에 보낸 상태의 값으로 유지한다', () => {
  const { sendState } = createStateSender(fakeSender);

  sendState({ targetProducts: [productA], isRunning: true });
  sendState({ currentIndex: 0 });

  expect(getSentStates().at(-1)).toEqual({
    targetProducts: [productA],
    invalidProductRows: [],
    currentIndex: 0,
    isPreparing: false,
    isRunning: true,
  });
});

it('sendState는 이전에 보낸 상태 객체를 바꾸지 않는다', () => {
  const { sendState } = createStateSender(fakeSender);

  sendState({ isRunning: true });
  sendState({ isRunning: false });

  const [firstState] = getSentStates();

  expect(firstState.isRunning).toBe(true);
});

it('새로 만들면 이전에 만든 sender의 상태를 이어받지 않고 빈 초기 상태에서 시작한다', () => {
  createStateSender(fakeSender).sendState({ targetProducts: [productA], isRunning: true });

  createStateSender(fakeSender).sendState({ isPreparing: true });

  expect(getSentStates().at(-1)).toEqual({
    targetProducts: [],
    invalidProductRows: [],
    currentIndex: null,
    isPreparing: true,
    isRunning: false,
  });
});

const productB: TargetProductWithUpdate = { ...productA, name: '상품B', originProductNo: 222 };
const errorUpdate = { status: 'error', message: '가격 수정 실패', time: 1700000000000 } as const;
const completeUpdate = {
  status: 'complete',
  price: 39990,
  baseFee: 3000,
  time: 1700000000000,
} as const;

it('sendUpdate는 index 위치의 상품만 수정 결과를 바꾼 상태를 보낸다', () => {
  const { sendState, sendUpdate } = createStateSender(fakeSender);

  sendState({ targetProducts: [productA, productB] });
  sendUpdate(1, errorUpdate);

  expect(getSentStates().at(-1)?.targetProducts).toEqual([
    productA,
    { ...productB, update: errorUpdate },
  ]);
});

it('sendUpdate는 앞에서 반영한 다른 상품의 수정 결과를 유지한다', () => {
  const { sendState, sendUpdate } = createStateSender(fakeSender);

  sendState({ targetProducts: [productA, productB] });
  sendUpdate(0, errorUpdate);
  sendUpdate(1, completeUpdate);

  expect(getSentStates().at(-1)?.targetProducts).toEqual([
    { ...productA, update: errorUpdate },
    { ...productB, update: completeUpdate },
  ]);
});

it('sendUpdate는 상품 목록 외의 값은 기존 상태를 유지한다', () => {
  const { sendState, sendUpdate } = createStateSender(fakeSender);

  sendState({ targetProducts: [productA], currentIndex: 0, isRunning: true });
  sendUpdate(0, errorUpdate);

  expect(getSentStates().at(-1)).toMatchObject({ currentIndex: 0, isRunning: true });
});

it('sendUpdate는 이전에 보낸 상품 목록을 바꾸지 않는다', () => {
  const { sendState, sendUpdate } = createStateSender(fakeSender);

  sendState({ targetProducts: [productA] });
  sendUpdate(0, errorUpdate);

  const [firstState] = getSentStates();

  expect(firstState.targetProducts[0].update).toEqual({ status: 'wait' });
});
