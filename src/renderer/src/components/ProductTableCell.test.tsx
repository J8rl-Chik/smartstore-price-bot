import { expect, test } from 'vitest';
import ProductTableCell from './ProductTableCell';
import { customRender } from '../customRender';

// td는 table > tbody > tr 안에서만 유효한 마크업이라 감싸서 렌더링한다.
const renderCell = (cell: React.JSX.Element) =>
  customRender(
    <table>
      <tbody>
        <tr>{cell}</tr>
      </tbody>
    </table>,
  );

test('내용을 cell로 보여준다', async () => {
  const screen = await renderCell(<ProductTableCell>상품A</ProductTableCell>);

  await expect.element(screen.getByRole('cell', { name: '상품A' })).toBeVisible();
});

test('기본은 왼쪽 정렬이다', async () => {
  const screen = await renderCell(<ProductTableCell>상품A</ProductTableCell>);

  await expect.element(screen.getByRole('cell', { name: '상품A' })).toHaveStyle('text-align: left');
});

test('$isRight이면 오른쪽 정렬이다', async () => {
  const screen = await renderCell(<ProductTableCell $isRight>42,900원</ProductTableCell>);

  await expect
    .element(screen.getByRole('cell', { name: '42,900원' }))
    .toHaveStyle('text-align: right');
});
