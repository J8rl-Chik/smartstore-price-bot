import { expect, test } from 'vitest';
import DeliveryFeeInfo from './DeliveryFeeInfo';
import { customRender } from '../customRender';

test('배송비가 있으면 제품가와 배송비를 보여준다', async () => {
  const screen = await customRender(<DeliveryFeeInfo price={32000} deliveryFee={3000} />);

  await expect.element(screen.getByText('제품 32,000 + 배송 3,000')).toBeVisible();
});

test('배송비가 있으면 무료배송을 보여주지 않는다', async () => {
  const screen = await customRender(<DeliveryFeeInfo price={32000} deliveryFee={3000} />);

  await expect.element(screen.getByText('무료배송')).not.toBeInTheDocument();
});

test('배송비가 0이면 무료배송을 보여준다', async () => {
  const screen = await customRender(<DeliveryFeeInfo price={35000} deliveryFee={0} />);

  await expect.element(screen.getByText('무료배송')).toBeVisible();
});

test('배송비가 0이면 제품가와 배송비를 보여주지 않는다', async () => {
  const screen = await customRender(<DeliveryFeeInfo price={35000} deliveryFee={0} />);

  await expect.element(screen.getByText(/제품/)).not.toBeInTheDocument();
  await expect.element(screen.getByText('무료배송')).toBeVisible();
});
