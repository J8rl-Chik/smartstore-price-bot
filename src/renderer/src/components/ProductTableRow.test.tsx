import { expect, test } from 'vitest';
import ProductTableRow from './ProductTableRow';
import { customRender } from '../customRender';
import { DELIVERY_FEE_TYPE } from '../../../domain/delivery/_constant';
import type { TargetProductUpdate, TargetProductWithUpdate } from '../../../domain/product/_type';

// formatTime이 로컬 시간 기준이라, 로컬 시간 13:34:48의 타임스탬프로 만든다.
const updateTime = new Date(2026, 0, 1, 13, 34, 48).getTime();

/**
 * 설정가 32,000 + 배송 3,000(시트), 현재가 31,000 + 배송 3,000(스토어),
 * 수정가 30,800 + 배송 3,000(수정 결과)으로 보이는 상품.
 */
const baseProduct: TargetProductWithUpdate = {
  name: '블루투스 스피커 미니',
  originProductNo: 2,
  store: { salePrice: 31000, stockQuantity: 10, deliveryFee: 3000 },
  sheet: {
    catalogURL: 'https://catalog.example/2',
    delivery: { feeType: DELIVERY_FEE_TYPE.PAID, baseFee: 3000 },
    freeDeliveryPrice: 50000,
    productPrice: 32000,
    virtualPrice: null,
    excludedSellerNames: [],
  },
  update: { status: 'complete', price: 30800, baseFee: 3000, time: updateTime },
};

const renderRow = (targetProduct: TargetProductWithUpdate, isUpdating = false) =>
  customRender(<ProductTableRow targetProduct={targetProduct} isUpdating={isUpdating} />);

test('상품 이름을 보여준다', async () => {
  const screen = await renderRow(baseProduct);

  await expect.element(screen.getByRole('cell', { name: '블루투스 스피커 미니' })).toBeVisible();
});

test('설정가, 현재가, 수정가를 제품가와 배송비를 더한 합계로 천 단위 구분 기호와 원 단위로 보여준다', async () => {
  const screen = await renderRow(baseProduct);

  await expect.element(screen.getByText('35,000원', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('34,000원', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('33,800원', { exact: false })).toBeVisible();
});

// 수정에 실패하면 수정가는 없고 수정 시간은 있어, 수정가 칸만 —로 보인다.
const errorUpdate: TargetProductUpdate = {
  status: 'error',
  message: '네이버 상품 가격을 수정하지 못했습니다.',
  time: updateTime,
};

test('수정가가 없으면 —로 보여준다', async () => {
  const screen = await renderRow({ ...baseProduct, update: errorUpdate });

  await expect.element(screen.getByText('—')).toBeVisible();
});

test('설정가, 현재가, 수정가 아래에 제품가와 배송비를 보여준다', async () => {
  const screen = await renderRow(baseProduct);

  await expect.element(screen.getByText('제품 32,000 + 배송 3,000')).toBeVisible();
  await expect.element(screen.getByText('제품 31,000 + 배송 3,000')).toBeVisible();
  await expect.element(screen.getByText('제품 30,800 + 배송 3,000')).toBeVisible();
});

test('설정가, 현재가, 수정가 아래에 각자의 배송비를 보여준다', async () => {
  const screen = await renderRow({
    ...baseProduct,
    store: { ...baseProduct.store, salePrice: 31500, deliveryFee: 2500 },
    update: { status: 'complete', price: 31800, baseFee: 2000, time: updateTime },
  });

  await expect.element(screen.getByText('제품 32,000 + 배송 3,000')).toBeVisible();
  await expect.element(screen.getByText('제품 31,500 + 배송 2,500')).toBeVisible();
  await expect.element(screen.getByText('제품 31,800 + 배송 2,000')).toBeVisible();
});

// 설정가 35,000 + 배송 0, 현재가 34,000 + 배송 0으로 보이는 무료배송 상품.
const freeDeliveryProduct: TargetProductWithUpdate = {
  ...baseProduct,
  store: { ...baseProduct.store, salePrice: 34000, deliveryFee: 0 },
  sheet: {
    ...baseProduct.sheet,
    delivery: { feeType: DELIVERY_FEE_TYPE.FREE },
    freeDeliveryPrice: 35000,
  },
  update: { status: 'complete', price: 33800, baseFee: 0, time: updateTime },
};

test('배송비가 0이면 설정가, 현재가, 수정가 아래에 무료배송을 보여준다', async () => {
  const screen = await renderRow(freeDeliveryProduct);

  expect(screen.getByText('무료배송').elements()).toHaveLength(3);
});

test('배송비가 0이면 합계는 제품가와 같다', async () => {
  const screen = await renderRow(freeDeliveryProduct);

  await expect.element(screen.getByText('35,000원', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('34,000원', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('33,800원', { exact: false })).toBeVisible();
});

test('배송비가 0이어도 수정가가 없으면 수정가 아래에는 무료배송을 보여주지 않는다', async () => {
  const screen = await renderRow({ ...freeDeliveryProduct, update: errorUpdate });

  expect(screen.getByText('무료배송').elements()).toHaveLength(2);
  await expect.element(screen.getByText('—')).toBeVisible();
});

test('수정가가 없으면 수정가 아래에는 부가 정보를 보여주지 않는다', async () => {
  const screen = await renderRow({ ...baseProduct, update: errorUpdate });

  expect(screen.getByText(/제품 /).elements()).toHaveLength(2);
});

test('상태 뱃지와 수정 시간을 보여준다', async () => {
  const screen = await renderRow(baseProduct);

  await expect.element(screen.getByText('완료')).toBeVisible();
  await expect.element(screen.getByText('13:34:48')).toBeVisible();
});

test('실패 이유가 있으면 상태 칸에 상태 뱃지와 함께 보여준다', async () => {
  const screen = await renderRow({ ...baseProduct, update: errorUpdate });

  const statusCell = screen.getByRole('cell', { name: /에러/ });

  await expect.element(statusCell.getByText('에러')).toBeVisible();
  await expect
    .element(statusCell.getByText('네이버 상품 가격을 수정하지 못했습니다.'))
    .toBeVisible();
});

test('실패 이유가 없으면 상태 뱃지만 보여준다', async () => {
  const screen = await renderRow(baseProduct);

  // exact로 비교해 상태 칸에 뱃지 문구 말고 다른 글자가 없는지 확인한다.
  await expect.element(screen.getByRole('cell', { name: '완료', exact: true })).toBeVisible();
});

// theme.color.blue50(#eff6ff)을 getComputedStyle이 돌려주는 rgb 형식으로 적었다.
const updatingRowBackground = 'rgb(239, 246, 255)';

test('수정 중인 상품이면 행 배경을 강조한다', async () => {
  const screen = await renderRow(baseProduct, true);

  await expect
    .element(screen.getByRole('row'))
    .toHaveStyle({ backgroundColor: updatingRowBackground });
});

test('수정 중인 상품이 아니면 행 배경을 강조하지 않는다', async () => {
  const screen = await renderRow(baseProduct);

  await expect
    .element(screen.getByRole('row'))
    .not.toHaveStyle({ backgroundColor: updatingRowBackground });
});
