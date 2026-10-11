import { expect, test } from 'vitest';
import ProductTable from './ProductTable';
import type { ProductListItem } from './ProductTableRow';
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

// getComputedStyle은 width를 %가 아닌 px로 돌려주므로, 뷰포트 크기에 영향받지 않도록
// 렌더링된 열 너비를 테이블 너비에 대한 비율로 구한다.
const getColumnWidthRatio = async (testId: string): Promise<number> => {
  const screen = await customRender(<ProductTable products={PRODUCTS} />);
  const table = screen.getByRole('table', { name: '상품 목록' }).element();
  const column = screen.getByTestId(testId).element();

  return column.getBoundingClientRect().width / table.getBoundingClientRect().width;
};

test('상품 목록 제목을 테이블의 이름으로 보여준다', async () => {
  const screen = await customRender(<ProductTable products={PRODUCTS} />);

  await expect.element(screen.getByRole('table', { name: '상품 목록' })).toBeVisible();
  await expect.element(screen.getByText('상품 목록')).toBeVisible();
});

test('테이블 컬럼 헤더를 보여준다', async () => {
  const screen = await customRender(<ProductTable products={PRODUCTS} />);

  await expect.element(screen.getByRole('columnheader', { name: '제품명' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '설정가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '현재가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '수정가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '상태' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '수정 시간' })).toBeVisible();
});

test('헤더 행과 상품 행으로 구성된다', async () => {
  const screen = await customRender(<ProductTable products={PRODUCTS} />);
  const thead = screen.getByRole('rowgroup').nth(0); // rowgroup은 thead, tbody 순서로 2개다.
  const tbody = screen.getByRole('rowgroup').nth(1);

  expect(thead.getByRole('row').elements()).toHaveLength(1);
  expect(tbody.getByRole('row').elements()).toHaveLength(PRODUCTS.length);

  await expect.element(screen.getByRole('cell', { name: '무선 이어폰 프로' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: '블루투스 스피커 미니' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: '스테인리스 텀블러' })).toBeVisible();
});

test('상품이 없으면 헤더 행만 보여준다', async () => {
  const screen = await customRender(<ProductTable products={[]} />);

  await expect.element(screen.getByRole('columnheader', { name: '제품명' })).toBeVisible();
  await expect.element(screen.getByRole('cell')).not.toBeInTheDocument();
});

/**
 * 열 너비는 서브픽셀(소수) 단위로 계산되어 비율이 정확히 떨어지지 않을 수 있다.
 * toBeCloseTo의 자릿수(numDigits) 기본값은 2이고, |실제 - 기대값| < 0.005이면 통과한다.
 */
test('제품명 열의 너비는 42%이다', async () => {
  expect(await getColumnWidthRatio('col-name')).toBeCloseTo(0.42);
});

test('설정가 열의 너비는 12%이다', async () => {
  expect(await getColumnWidthRatio('col-set-price')).toBeCloseTo(0.12);
});

test('현재가 열의 너비는 12%이다', async () => {
  expect(await getColumnWidthRatio('col-current-price')).toBeCloseTo(0.12);
});

test('수정가 열의 너비는 12%이다', async () => {
  expect(await getColumnWidthRatio('col-updated-price')).toBeCloseTo(0.12);
});

test('상태 열의 너비는 10%이다', async () => {
  expect(await getColumnWidthRatio('col-status')).toBeCloseTo(0.1);
});

test('수정 시간 열의 너비는 12%이다', async () => {
  expect(await getColumnWidthRatio('col-updated-at')).toBeCloseTo(0.12);
});
