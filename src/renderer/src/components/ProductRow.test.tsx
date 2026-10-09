import { expect, test } from 'vitest';
import ProductRow from './ProductRow';
import type { ProductListItem } from './ProductRow';
import { customRender } from '../customRender';

const PRODUCT: ProductListItem = {
  id: 2,
  name: '블루투스 스피커 미니',
  setPrice: 35000,
  currentPrice: 34000,
  updatedPrice: 33800,
  status: 'needUpdate',
  updatedAt: '1시간 전',
};

// tr은 table > tbody 안에서만 유효한 마크업이라 감싸서 렌더링한다.
const renderRow = (product: ProductListItem) =>
  customRender(
    <table>
      <tbody>
        <ProductRow product={product} />
      </tbody>
    </table>,
  );

test('상품 이름을 보여준다', async () => {
  const screen = await renderRow(PRODUCT);

  await expect.element(screen.getByRole('cell', { name: '블루투스 스피커 미니' })).toBeVisible();
});

test('설정가, 현재가, 수정가를 천 단위 구분 기호와 원 단위로 보여준다', async () => {
  const screen = await renderRow(PRODUCT);

  await expect.element(screen.getByText('35,000원')).toBeVisible();
  await expect.element(screen.getByText('34,000원')).toBeVisible();
  await expect.element(screen.getByText('33,800원')).toBeVisible();
});

test('수정가가 없으면 —로 보여준다', async () => {
  const screen = await renderRow({ ...PRODUCT, updatedPrice: null });

  await expect.element(screen.getByText('—')).toBeVisible();
});

test('상태 뱃지와 수정 시간을 보여준다', async () => {
  const screen = await renderRow(PRODUCT);

  await expect.element(screen.getByText('업데이트 필요')).toBeVisible();
  await expect.element(screen.getByText('1시간 전')).toBeVisible();
});
