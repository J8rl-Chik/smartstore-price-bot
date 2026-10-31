import { expect, test } from 'vitest';
import InvalidProductRowBanner from './InvalidProductRowBanner';
import { customRender } from '../customRender';

const invalidProductRows = [
  { name: '무선 충전기', errorMessages: ['productPrice: 숫자가 아닙니다.'] },
  {
    name: '스테인리스 텀블러',
    errorMessages: ['baseFee: 숫자가 아닙니다.', 'feeType: 알 수 없는 값입니다.'],
  },
];

test('시트 제품 행 변환 오류 제목을 보여준다', async () => {
  const screen = await customRender(<InvalidProductRowBanner rows={invalidProductRows} />);

  await expect
    .element(screen.getByRole('heading', { name: '시트 제품 행 변환 오류' }))
    .toBeVisible();
});

test('변환에 실패한 행의 상품명을 보여준다', async () => {
  const screen = await customRender(<InvalidProductRowBanner rows={invalidProductRows} />);

  await expect.element(screen.getByText('무선 충전기')).toBeVisible();
  await expect.element(screen.getByText('스테인리스 텀블러')).toBeVisible();
});

test('행마다 실패 이유를 모두 보여준다', async () => {
  const screen = await customRender(<InvalidProductRowBanner rows={invalidProductRows} />);

  await expect.element(screen.getByText('productPrice: 숫자가 아닙니다.')).toBeVisible();
  await expect.element(screen.getByText('baseFee: 숫자가 아닙니다.')).toBeVisible();
  await expect.element(screen.getByText('feeType: 알 수 없는 값입니다.')).toBeVisible();
});
