import { expect, test } from 'vitest';
import ProductTable from './ProductTable';
import { customRender } from '../customRender';
import { DELIVERY_FEE_TYPE } from '../../../domain/delivery/_constant';
import type { TargetProductWithUpdate } from '../../../domain/product/_type';

const createTargetProduct = (
  overrides: Partial<Pick<TargetProductWithUpdate, 'name' | 'originProductNo' | 'update'>> = {},
): TargetProductWithUpdate => ({
  name: '무선 이어폰 프로',
  originProductNo: 1,
  store: { salePrice: 39900, stockQuantity: 10, deliveryFee: 3000 },
  sheet: {
    catalogURL: 'https://catalog.example/1',
    delivery: { feeType: DELIVERY_FEE_TYPE.PAID, baseFee: 3000 },
    freeDeliveryPrice: 50000,
    productPrice: 39900,
    virtualPrice: null,
    excludedSellerNames: [],
  },
  update: { status: 'wait' },
  ...overrides,
});

// 수정 완료, 대기, 실패 상태의 상품을 하나씩 둔다.
const targetProducts: TargetProductWithUpdate[] = [
  createTargetProduct({
    update: { status: 'complete', price: 39900, baseFee: 3000, time: 1700000000000 },
  }),
  createTargetProduct({ name: '블루투스 스피커 미니', originProductNo: 2 }),
  createTargetProduct({
    name: '스테인리스 텀블러',
    originProductNo: 3,
    update: {
      status: 'error',
      message: '네이버 상품 가격을 수정하지 못했습니다.',
      time: 1700000000000,
    },
  }),
];

test('상품 목록 제목을 테이블의 이름으로 보여준다', async () => {
  const screen = await customRender(
    <ProductTable targetProducts={targetProducts} currentProductId={null} isPreparing={false} />,
  );

  await expect.element(screen.getByRole('table', { name: '상품 목록' })).toBeVisible();
  await expect.element(screen.getByText('상품 목록')).toBeVisible();
});

test('테이블 컬럼 헤더를 보여준다', async () => {
  const screen = await customRender(
    <ProductTable targetProducts={targetProducts} currentProductId={null} isPreparing={false} />,
  );

  await expect.element(screen.getByRole('columnheader', { name: '제품명' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '설정가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '현재가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '수정가' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '상태' })).toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '수정 시간' })).toBeVisible();
});

test('헤더 행과 상품 행으로 구성된다', async () => {
  const screen = await customRender(
    <ProductTable targetProducts={targetProducts} currentProductId={null} isPreparing={false} />,
  );
  const thead = screen.getByRole('rowgroup').nth(0); // rowgroup은 thead, tbody 순서로 2개다.
  const tbody = screen.getByRole('rowgroup').nth(1);

  expect(thead.getByRole('row').elements()).toHaveLength(1);
  expect(tbody.getByRole('row').elements()).toHaveLength(targetProducts.length);

  await expect.element(screen.getByRole('cell', { name: '무선 이어폰 프로' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: '블루투스 스피커 미니' })).toBeVisible();
  await expect.element(screen.getByRole('cell', { name: '스테인리스 텀블러' })).toBeVisible();
});

// theme.color.blue50(#eff6ff)을 getComputedStyle이 돌려주는 rgb 형식으로 적었다.
const updatingRowBackground = 'rgb(239, 246, 255)';

test('currentProductId와 originProductNo가 같은 상품 행만 강조한다', async () => {
  const screen = await customRender(
    <ProductTable targetProducts={targetProducts} currentProductId={2} isPreparing={false} />,
  );

  await expect
    .element(screen.getByRole('row', { name: /블루투스 스피커 미니/ }))
    .toHaveStyle({ backgroundColor: updatingRowBackground });
  await expect
    .element(screen.getByRole('row', { name: /무선 이어폰 프로/ }))
    .not.toHaveStyle({ backgroundColor: updatingRowBackground });
  await expect
    .element(screen.getByRole('row', { name: /스테인리스 텀블러/ }))
    .not.toHaveStyle({ backgroundColor: updatingRowBackground });
});

test('currentProductId가 null이면 강조하는 행이 없다', async () => {
  const screen = await customRender(
    <ProductTable targetProducts={targetProducts} currentProductId={null} isPreparing={false} />,
  );
  const tbody = screen.getByRole('rowgroup').nth(1);

  for (const row of tbody.getByRole('row').all()) {
    await expect.element(row).not.toHaveStyle({ backgroundColor: updatingRowBackground });
  }
});

test('상품이 없으면 헤더 행만 보여준다', async () => {
  const screen = await customRender(
    <ProductTable targetProducts={[]} currentProductId={null} isPreparing={false} />,
  );

  await expect.element(screen.getByRole('columnheader', { name: '제품명' })).toBeVisible();
  await expect.element(screen.getByRole('cell')).not.toBeInTheDocument();
});

test('준비 중이면 상품 행 대신 불러오는 중 상자를 보여준다', async () => {
  const screen = await customRender(
    <ProductTable targetProducts={[]} currentProductId={null} isPreparing />,
  );

  await expect
    .element(screen.getByRole('status', { name: '상품 목록을 불러오는 중' }))
    .toBeVisible();
  await expect.element(screen.getByRole('columnheader', { name: '제품명' })).toBeVisible();
});

test('준비 중이면 상품이 있어도 상품 행을 보여주지 않는다', async () => {
  const screen = await customRender(
    <ProductTable targetProducts={targetProducts} currentProductId={null} isPreparing />,
  );

  await expect
    .element(screen.getByRole('cell', { name: '무선 이어폰 프로' }))
    .not.toBeInTheDocument();
});

test('준비 중이면 표가 부모의 남은 높이를 채워 스켈레톤 셀이 최소 높이보다 커진다', async () => {
  // AppContainer처럼 높이가 정해진 flex column 안에 렌더한다.
  const screen = await customRender(
    <div style={{ display: 'flex', flexDirection: 'column', height: '800px' }}>
      <ProductTable targetProducts={[]} currentProductId={null} isPreparing />
    </div>,
  );
  const skeletonCell = screen.getByRole('status', { name: '상품 목록을 불러오는 중' }).element();

  // 스켈레톤 셀의 최소 높이(상자 240px + 위아래 여백 32px)
  expect(skeletonCell.getBoundingClientRect().height).toBeGreaterThan(272);
});

test('준비 중이 아니면 불러오는 중 상자를 보여주지 않는다', async () => {
  const screen = await customRender(
    <ProductTable targetProducts={targetProducts} currentProductId={null} isPreparing={false} />,
  );

  await expect.element(screen.getByRole('status')).not.toBeInTheDocument();
});

/**
 * getComputedStyle은 width를 %가 아닌 px로 돌려주므로, 뷰포트 크기에 영향받지 않도록
 * 렌더링된 열 너비를 테이블 너비에 대한 비율로 구한다.
 */
const getColumnWidthRatio = async (testId: string): Promise<number> => {
  const screen = await customRender(
    <ProductTable targetProducts={targetProducts} currentProductId={null} isPreparing={false} />,
  );
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
