import { expect, it } from 'vitest';
import reuseUnchangedProducts from './reuseUnchangedProducts';
import type { TargetProductWithUpdate, UpdateState } from '../../../domain/product/_type';

const createTargetProduct = (
  overrides: Partial<TargetProductWithUpdate> = {},
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

const createUpdateState = (targetProducts: TargetProductWithUpdate[]): UpdateState => ({
  targetProducts,
  invalidProductRows: [],
  currentIndex: null,
  isPreparing: false,
  isRunning: true,
  errorMessage: null,
  nextRunAt: null,
});

const firstProduct = createTargetProduct();
const secondProduct = createTargetProduct({ name: '블루투스 스피커 미니', originProductNo: 2 });

it('내용이 같은 상품은 새로 받은 객체 대신 이전 객체를 그대로 쓴다', () => {
  const prevState = createUpdateState([firstProduct, secondProduct]);
  // IPC로 받은 것처럼 내용은 같고 참조만 다른 객체를 만든다.
  const nextState = structuredClone(prevState);

  const { targetProducts } = reuseUnchangedProducts(prevState, nextState);

  expect(targetProducts[0]).toBe(firstProduct);
  expect(targetProducts[1]).toBe(secondProduct);
});

it('내용이 바뀐 상품만 새로 받은 객체를 쓴다', () => {
  const prevState = createUpdateState([firstProduct, secondProduct]);
  const updatedSecondProduct = createTargetProduct({
    name: '블루투스 스피커 미니',
    originProductNo: 2,
    update: { status: 'complete', price: 41900, baseFee: 0, time: 1700000000000 },
  });
  const nextState = createUpdateState([structuredClone(firstProduct), updatedSecondProduct]);

  const { targetProducts } = reuseUnchangedProducts(prevState, nextState);

  expect(targetProducts[0]).toBe(firstProduct);
  expect(targetProducts[1]).toBe(updatedSecondProduct);
});

it('이전 상태에 없던 자리의 상품은 새로 받은 객체를 쓴다', () => {
  const prevState = createUpdateState([]);
  const nextState = createUpdateState([firstProduct, secondProduct]);

  const { targetProducts } = reuseUnchangedProducts(prevState, nextState);

  expect(targetProducts[0]).toBe(firstProduct);
  expect(targetProducts[1]).toBe(secondProduct);
});

it('상품 목록 외의 상태는 새로 받은 값을 쓴다', () => {
  const prevState = createUpdateState([firstProduct]);
  const nextState: UpdateState = {
    ...createUpdateState([structuredClone(firstProduct)]),
    currentIndex: 0,
    errorMessage: '네이버 로그인에 실패했습니다.',
    nextRunAt: 1700000000000,
  };

  expect(reuseUnchangedProducts(prevState, nextState)).toMatchObject({
    invalidProductRows: [],
    currentIndex: 0,
    isPreparing: false,
    isRunning: true,
    errorMessage: '네이버 로그인에 실패했습니다.',
    nextRunAt: 1700000000000,
  });
});
