import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Page } from 'puppeteer';
import updateTargetProducts from './updateTargetProducts';
import type { TargetProduct } from '../domain/product/_type';

const mockUpdateTargetProduct = vi.fn();
const mockDelaySeconds = vi.fn();

vi.mock(import('./updateTargetProduct'), () => ({
  default: (...args: unknown[]) => mockUpdateTargetProduct(...args),
}));

vi.mock(import('../utils/delaySeconds'), () => ({
  default: (...args: unknown[]) => mockDelaySeconds(...args),
}));

const PAGE = { name: 'fake-page' } as unknown as Page;
const MY_STORE_NAME = '내스토어';

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

afterEach(() => {
  mockUpdateTargetProduct.mockReset();
  mockDelaySeconds.mockReset();
});

describe('updateTargetProducts', () => {
  it('시작하면 상품 전체가 wait 상태이고 isRunning: true인 상태를 알린다', async () => {
    mockUpdateTargetProduct.mockResolvedValue({ status: 'updated', salePrice: 42900, baseFee: 0 });
    const emit = vi.fn();

    await updateTargetProducts(PAGE, [FIRST_PRODUCT, SECOND_PRODUCT], MY_STORE_NAME, emit);

    expect(emit).toHaveBeenNthCalledWith(1, {
      targetProducts: [
        { ...FIRST_PRODUCT, update: { status: 'wait' } },
        { ...SECOND_PRODUCT, update: { status: 'wait' } },
      ],
      currentIndex: null,
      isRunning: true,
    });
  });

  it('상품을 처리하기 전에 currentIndex를 올린 상태를 먼저 알린다', async () => {
    mockUpdateTargetProduct.mockResolvedValue({ status: 'updated', salePrice: 42900, baseFee: 0 });
    const emit = vi.fn();

    await updateTargetProducts(PAGE, [FIRST_PRODUCT, SECOND_PRODUCT], MY_STORE_NAME, emit);

    expect(emit.mock.calls[1]?.[0]).toMatchObject({ currentIndex: 0 });
    expect(emit.mock.calls[3]?.[0]).toMatchObject({ currentIndex: 1 });
  });

  it('가격 수정에 성공하면 해당 상품을 complete 상태로 반영해 알린다', async () => {
    mockUpdateTargetProduct.mockResolvedValue({
      status: 'updated',
      salePrice: 39900,
      baseFee: 3000,
    });
    const emit = vi.fn();

    await updateTargetProducts(PAGE, [FIRST_PRODUCT], MY_STORE_NAME, emit);

    const lastState = emit.mock.calls.at(-1)?.[0];

    expect(lastState.targetProducts[0]).toMatchObject({
      update: { status: 'complete', price: 39900, baseFee: 3000 },
    });
  });

  it('가격 수정을 건너뛰면 현재 스토어 가격으로 complete 상태를 반영한다', async () => {
    const product = createTargetProduct(1, '무선 이어폰 프로');
    product.store.salePrice = 42900;
    product.store.deliveryFee = 3000;
    mockUpdateTargetProduct.mockResolvedValue({ status: 'skipped' });
    const emit = vi.fn();

    await updateTargetProducts(PAGE, [product], MY_STORE_NAME, emit);

    const lastState = emit.mock.calls.at(-1)?.[0];

    expect(lastState.targetProducts[0]).toMatchObject({
      update: { status: 'complete', price: 42900, baseFee: 3000 },
    });
  });

  it('일시적 실패는 해당 상품만 error로 반영하고 나머지 상품을 계속 처리한다', async () => {
    mockUpdateTargetProduct
      .mockResolvedValueOnce({ status: 'error', error: '일시적 실패', isFatal: false })
      .mockResolvedValueOnce({ status: 'updated', salePrice: 42900, baseFee: 0 });
    const emit = vi.fn();

    await updateTargetProducts(PAGE, [FIRST_PRODUCT, SECOND_PRODUCT], MY_STORE_NAME, emit);

    expect(mockUpdateTargetProduct).toHaveBeenCalledTimes(2);

    const lastState = emit.mock.calls.at(-1)?.[0];

    expect(lastState.targetProducts.map((target) => target.update.status)).toEqual([
      'error',
      'complete',
    ]);
  });

  it('치명적 실패는 나머지 상품을 처리하지 않고 순회를 중단한다', async () => {
    mockUpdateTargetProduct.mockResolvedValueOnce({
      status: 'error',
      error: '로그인 페이지가 생성되지 않았습니다.',
      isFatal: true,
    });
    const emit = vi.fn();

    await updateTargetProducts(PAGE, [FIRST_PRODUCT, SECOND_PRODUCT], MY_STORE_NAME, emit);

    expect(mockUpdateTargetProduct).toHaveBeenCalledOnce();

    const lastState = emit.mock.calls.at(-1)?.[0];

    expect(lastState.targetProducts.map((target) => target.update.status)).toEqual([
      'error',
      'wait',
    ]);
  });

  it('상품을 처리한 뒤에는 다음 상품으로 넘어가기 전에 대기한다', async () => {
    mockUpdateTargetProduct.mockResolvedValue({ status: 'updated', salePrice: 42900, baseFee: 0 });

    await updateTargetProducts(PAGE, [FIRST_PRODUCT, SECOND_PRODUCT], MY_STORE_NAME, vi.fn());

    expect(mockDelaySeconds).toHaveBeenCalledWith(5);
    expect(mockDelaySeconds).toHaveBeenCalledTimes(2);
  });

  it('순회가 끝나면 currentIndex를 null로, isRunning을 false로 되돌려 알린다', async () => {
    mockUpdateTargetProduct.mockResolvedValue({ status: 'updated', salePrice: 42900, baseFee: 0 });
    const emit = vi.fn();

    await updateTargetProducts(PAGE, [FIRST_PRODUCT], MY_STORE_NAME, emit);

    expect(emit.mock.calls.at(-1)?.[0]).toMatchObject({ currentIndex: null, isRunning: false });
  });

  it('순회 중 에러가 나도 currentIndex를 null로, isRunning을 false로 되돌려 알린다', async () => {
    mockUpdateTargetProduct.mockRejectedValue(new Error('브라우저 종료'));
    const emit = vi.fn();

    await expect(updateTargetProducts(PAGE, [FIRST_PRODUCT], MY_STORE_NAME, emit)).rejects.toThrow(
      '브라우저 종료',
    );

    expect(emit.mock.calls.at(-1)?.[0]).toMatchObject({ currentIndex: null, isRunning: false });
  });
});
