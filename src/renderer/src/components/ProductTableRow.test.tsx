import { expect, test } from 'vitest';
import ProductTableRow from './ProductTableRow';
import { customRender } from '../customRender';
import type { TProductTableRow } from '../domain/_type';

const PRODUCT: TProductTableRow = {
  id: 2,
  name: '블루투스 스피커 미니',
  configuredPrice: { price: 32000, deliveryFee: 3000 },
  currentPrice: { price: 31000, deliveryFee: 3000 },
  updatedPrice: { price: 30800, deliveryFee: 3000 },
  status: 'complete',
  updateTime: '13:34:48',
};

const renderRow = (product: TProductTableRow) =>
  customRender(<ProductTableRow product={product} />);

test('상품 이름을 보여준다', async () => {
  const screen = await renderRow(PRODUCT);

  await expect.element(screen.getByRole('cell', { name: '블루투스 스피커 미니' })).toBeVisible();
});

test('설정가, 현재가, 수정가를 제품가와 배송비를 더한 합계로 천 단위 구분 기호와 원 단위로 보여준다', async () => {
  const screen = await renderRow(PRODUCT);

  await expect.element(screen.getByText('35,000원', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('34,000원', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('33,800원', { exact: false })).toBeVisible();
});

test('수정가가 없으면 —로 보여준다', async () => {
  const screen = await renderRow({ ...PRODUCT, updatedPrice: null });

  await expect.element(screen.getByText('—')).toBeVisible();
});

test('설정가, 현재가, 수정가 아래에 제품가와 배송비를 보여준다', async () => {
  const screen = await renderRow(PRODUCT);

  await expect.element(screen.getByText('제품 32,000 + 배송 3,000')).toBeVisible();
  await expect.element(screen.getByText('제품 31,000 + 배송 3,000')).toBeVisible();
  await expect.element(screen.getByText('제품 30,800 + 배송 3,000')).toBeVisible();
});

test('설정가, 현재가, 수정가 아래에 각자의 배송비를 보여준다', async () => {
  const screen = await renderRow({
    ...PRODUCT,
    configuredPrice: { price: 32000, deliveryFee: 3000 },
    currentPrice: { price: 31500, deliveryFee: 2500 },
    updatedPrice: { price: 31800, deliveryFee: 2000 },
  });

  await expect.element(screen.getByText('제품 32,000 + 배송 3,000')).toBeVisible();
  await expect.element(screen.getByText('제품 31,500 + 배송 2,500')).toBeVisible();
  await expect.element(screen.getByText('제품 31,800 + 배송 2,000')).toBeVisible();
});

test('배송비가 0이면 설정가, 현재가, 수정가 아래에 무료배송을 보여준다', async () => {
  const screen = await renderRow({
    ...PRODUCT,
    configuredPrice: { price: 35000, deliveryFee: 0 },
    currentPrice: { price: 34000, deliveryFee: 0 },
    updatedPrice: { price: 33800, deliveryFee: 0 },
  });

  expect(screen.getByText('무료배송').elements()).toHaveLength(3);
});

test('배송비가 0이면 합계는 제품가와 같다', async () => {
  const screen = await renderRow({
    ...PRODUCT,
    configuredPrice: { price: 35000, deliveryFee: 0 },
    currentPrice: { price: 34000, deliveryFee: 0 },
    updatedPrice: { price: 33800, deliveryFee: 0 },
  });

  await expect.element(screen.getByText('35,000원', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('34,000원', { exact: false })).toBeVisible();
  await expect.element(screen.getByText('33,800원', { exact: false })).toBeVisible();
});

test('배송비가 0이어도 수정가가 없으면 수정가 아래에는 무료배송을 보여주지 않는다', async () => {
  const screen = await renderRow({
    ...PRODUCT,
    configuredPrice: { price: 35000, deliveryFee: 0 },
    currentPrice: { price: 34000, deliveryFee: 0 },
    updatedPrice: null,
  });

  expect(screen.getByText('무료배송').elements()).toHaveLength(2);
  await expect.element(screen.getByText('—')).toBeVisible();
});

test('수정가가 없으면 수정가 아래에는 부가 정보를 보여주지 않는다', async () => {
  const screen = await renderRow({ ...PRODUCT, updatedPrice: null });

  expect(screen.getByText(/제품 /).elements()).toHaveLength(2);
});

test('상태 뱃지와 수정 시간을 보여준다', async () => {
  const screen = await renderRow(PRODUCT);

  await expect.element(screen.getByText('완료')).toBeVisible();
  await expect.element(screen.getByText('13:34:48')).toBeVisible();
});
