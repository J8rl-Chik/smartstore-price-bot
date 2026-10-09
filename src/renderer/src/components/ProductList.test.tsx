import { expect, test } from 'vitest';
import ProductList from './ProductList';
import type { ProductListItem } from './ProductRow';
import { customRender } from '../customRender';

const PRODUCTS: ProductListItem[] = [
  {
    id: 1,
    name: '무선 이어폰 프로',
    setPrice: 42900,
    currentPrice: 42900,
    updatedPrice: 42900,
    status: 'normal',
    updatedAt: '2분 전',
  },
  {
    id: 2,
    name: '블루투스 스피커 미니',
    setPrice: 35000,
    currentPrice: 35000,
    updatedPrice: 33800,
    status: 'needUpdate',
    updatedAt: '1시간 전',
  },
  {
    id: 3,
    name: '스테인리스 텀블러',
    setPrice: 24500,
    currentPrice: 24500,
    updatedPrice: null,
    status: 'error',
    updatedAt: '3시간 전',
  },
];

test('상품 목록 제목과 전체보기 버튼을 보여준다', async () => {
  const screen = await customRender(<ProductList products={PRODUCTS} />);

  await expect.element(screen.getByRole('heading', { level: 2, name: '상품 목록' })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: /전체보기/ })).toBeVisible();
});

test('테이블 컬럼 헤더를 보여준다', async () => {
  const screen = await customRender(<ProductList products={PRODUCTS} />);

  await expect.element(screen.getByRole('columnheader', { name: '제품명' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '설정가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '현재가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '수정가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '상태' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '수정 시간' })).toBeVisible();
});

test('상품마다 한 행씩 보여준다', async () => {
  const screen = await customRender(<ProductList products={PRODUCTS} />);

  // 헤더 행 1개 + 상품 행 3개.
  await expect.element(screen.getByRole('row').nth(3)).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: '무선 이어폰 프로' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: '블루투스 스피커 미니' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: '스테인리스 텀블러' })).toBeVisible();
});

test('상품이 없으면 헤더 행만 보여준다', async () => {
  const screen = await customRender(<ProductList products={[]} />);

  await expect.element(screen.getByRole('columnheader', { name: '제품명' })).toBeVisible();
  await expect.element(screen.getByRole('cell')).not.toBeInTheDocument();
});
