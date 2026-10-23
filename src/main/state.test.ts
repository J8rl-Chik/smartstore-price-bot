import { describe, expect, it, vi } from 'vitest';
import type { WebContents } from 'electron';
import { initState, sendState, setState, setUpdate } from './state';
import type { TargetProduct, UpdateState } from '../domain/product/_type';

const createTargetProduct = (originProductNo: number, name: string): TargetProduct => ({
  name,
  originProductNo,
  store: { salePrice: 45000, stockQuantity: 10, deliveryFee: 3000 },
  sheet: {
    catalogURL: `https://search.shopping.naver.com/catalog/${originProductNo}`,
    virtualPrice: 44000,
    freeDeliveryPrice: 40000,
    productPrice: 30000,
    excludedSellerNames: ['제외 스토어'],
    delivery: { feeType: '유료', baseFee: 3000 },
  },
});

const productA = createTargetProduct(111, '상품A');
const productB = createTargetProduct(222, '상품B');

describe('initState', () => {
  it('상품 전체를 wait 상태로 두고, currentIndex는 null, isRunning은 true인 상태로 초기화한다', () => {
    expect(initState([productA, productB], [])).toEqual({
      targetProducts: [
        { ...productA, update: { status: 'wait' } },
        { ...productB, update: { status: 'wait' } },
      ],
      invalidProductRows: [],
      currentIndex: null,
      isRunning: true,
    });
  });

  it('상품 목록이 비어 있으면 빈 목록으로 초기화한다', () => {
    expect(initState([], [])).toEqual({
      targetProducts: [],
      invalidProductRows: [],
      currentIndex: null,
      isRunning: true,
    });
  });

  it('변환에 실패한 시트 행은 받은 그대로 담는다', () => {
    const invalidProductRows = [{ name: '상품C', errorMessages: ['productPrice: 에러'] }];

    expect(initState([productA], invalidProductRows).invalidProductRows).toEqual(
      invalidProductRows,
    );
  });

  it('이전에 바꾼 상태를 버리고 새 상품 목록으로 다시 초기화한다', () => {
    initState([productA], [{ name: '상품C', errorMessages: ['productPrice: 에러'] }]);
    setState({ currentIndex: 0, isRunning: false });

    expect(initState([productB], [])).toEqual({
      targetProducts: [{ ...productB, update: { status: 'wait' } }],
      invalidProductRows: [],
      currentIndex: null,
      isRunning: true,
    });
  });
});

describe('setState', () => {
  it('넘긴 값만 덮어쓰고 나머지는 기존 상태를 유지한다', () => {
    const initialState = initState([productA], []);

    expect(setState({ currentIndex: 0 })).toEqual({
      targetProducts: initialState.targetProducts,
      invalidProductRows: [],
      currentIndex: 0,
      isRunning: true,
    });
  });

  it('이전 호출에서 바꾼 값을 이어서 유지한다', () => {
    initState([productA], []);
    setState({ currentIndex: 0 });

    expect(setState({ isRunning: false })).toMatchObject({ currentIndex: 0, isRunning: false });
  });

  it('이전에 반환한 상태 객체는 바꾸지 않는다', () => {
    const initialState = initState([productA], []);

    setState({ isRunning: false });

    expect(initialState.isRunning).toBe(true);
  });
});

describe('setUpdate', () => {
  const errorUpdate = { status: 'error', time: 1700000000000 } as const;

  it('index 위치의 상품만 수정 결과를 바꾼다', () => {
    initState([productA, productB], []);

    expect(setUpdate(1, errorUpdate).targetProducts).toEqual([
      { ...productA, update: { status: 'wait' } },
      { ...productB, update: errorUpdate },
    ]);
  });

  it('상품 목록 외의 값은 기존 상태를 유지한다', () => {
    initState([productA], []);
    setState({ currentIndex: 0 });

    expect(setUpdate(0, errorUpdate)).toMatchObject({ currentIndex: 0, isRunning: true });
  });

  it('이전에 반환한 상태의 상품 목록은 바꾸지 않는다', () => {
    const initialState = initState([productA], []);

    setUpdate(0, errorUpdate);

    expect(initialState.targetProducts[0].update).toEqual({ status: 'wait' });
  });
});

describe('sendState', () => {
  it('넘긴 상태를 요청한 창의 updateState 채널로 보낸다', () => {
    const mockSend = vi.fn();
    const sender = { send: mockSend } as unknown as WebContents;
    const state: UpdateState = {
      targetProducts: [],
      invalidProductRows: [],
      currentIndex: null,
      isRunning: false,
    };

    sendState(sender, state);

    expect(mockSend).toHaveBeenCalledWith('updateState', state);
  });
});
