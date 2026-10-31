import { expect, test } from 'vitest';
import ProductTable from './ProductTable';
import { customRender } from '../customRender';
import type { TProductTableRow } from '../domain/_type';

const products: TProductTableRow[] = [
  {
    id: 1,
    name: '무선 이어폰 프로',
    configuredPrice: { price: 39900, deliveryFee: 3000 },
    currentPrice: { price: 39900, deliveryFee: 3000 },
    updatedPrice: { price: 39900, deliveryFee: 3000 },
    status: 'complete',
    errorMessage: null,
    updateTime: '14:32:05',
  },
  {
    id: 2,
    name: '블루투스 스피커 미니',
    configuredPrice: { price: 35000, deliveryFee: 0 },
    currentPrice: { price: 35000, deliveryFee: 0 },
    updatedPrice: null,
    status: 'wait',
    errorMessage: null,
    updateTime: '—',
  },
  {
    id: 3,
    name: '스테인리스 텀블러',
    configuredPrice: { price: 21500, deliveryFee: 3000 },
    currentPrice: { price: 21500, deliveryFee: 3000 },
    updatedPrice: null,
    status: 'error',
    errorMessage: '네이버 상품 가격을 수정하지 못했습니다.',
    updateTime: '11:35:09',
  },
];

test('상품 목록 제목을 테이블의 이름으로 보여준다', async () => {
  const screen = await customRender(<ProductTable products={products} />);

  await expect.element(screen.getByRole('table', { name: '상품 목록' })).toBeVisible();
  await expect.element(screen.getByText('상품 목록')).toBeVisible();
});

test('테이블 컬럼 헤더를 보여준다', async () => {
  const screen = await customRender(<ProductTable products={products} />);

  await expect.element(screen.getByRole('columnheader', { name: '제품명' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '설정가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '현재가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '수정가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '상태' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '수정 시간' })).toBeVisible();
});

test('헤더 행과 상품 행으로 구성된다', async () => {
  const screen = await customRender(<ProductTable products={products} />);
  const thead = screen.getByRole('rowgroup').nth(0); // rowgroup은 thead, tbody 순서로 2개다.
  const tbody = screen.getByRole('rowgroup').nth(1);

  expect(thead.getByRole('row').elements()).toHaveLength(1);
  expect(tbody.getByRole('row').elements()).toHaveLength(products.length);

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
 * getComputedStyle은 width를 %가 아닌 px로 돌려주므로, 뷰포트 크기에 영향받지 않도록
 * 렌더링된 열 너비를 테이블 너비에 대한 비율로 구한다.
 */
const getColumnWidthRatio = async (testId: string): Promise<number> => {
  const screen = await customRender(<ProductTable products={products} />);
  const table = screen.getByRole('table', { name: '상품 목록' }).element();
  const column = screen.getByTestId(testId).element();

  return column.getBoundingClientRect().width / table.getBoundingClientRect().width;
};

/**
 * 열 너비는 서브픽셀(소수) 단위로 계산되어 비율이 정확히 떨어지지 않을 수 있다.
 * toBeCloseTo의 자릿수(numDigits) 기본값은 2이고, |실제 - 기대값| < 0.005이면 통과한다.
 */
test('제품명 열의 너비는 38%이다', async () => {
  expect(await getColumnWidthRatio('col-name')).toBeCloseTo(0.38);
});

test('설정가 열의 너비는 14%이다', async () => {
  expect(await getColumnWidthRatio('col-set-price')).toBeCloseTo(0.14);
});

test('현재가 열의 너비는 14%이다', async () => {
  expect(await getColumnWidthRatio('col-current-price')).toBeCloseTo(0.14);
});

test('수정가 열의 너비는 14%이다', async () => {
  expect(await getColumnWidthRatio('col-updated-price')).toBeCloseTo(0.14);
});

test('상태 열의 너비는 10%이다', async () => {
  expect(await getColumnWidthRatio('col-status')).toBeCloseTo(0.1);
});

test('수정 시간 열의 너비는 10%이다', async () => {
  expect(await getColumnWidthRatio('col-updated-at')).toBeCloseTo(0.1);
});
