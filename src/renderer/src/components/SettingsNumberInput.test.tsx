import { expect, test } from 'vitest';
import SettingsNumberInput from './SettingsNumberInput';
import { customRender } from '../customRender';

test('숫자 입력칸과 단위를 보여준다', async () => {
  const screen = await customRender(<SettingsNumberInput unit="분" aria-label="순회 간격" />);

  await expect.element(screen.getByLabelText('순회 간격')).toHaveAttribute('type', 'number');
  await expect.element(screen.getByText('분')).toBeVisible();
});

test('입력칸 속성을 input에 전달한다', async () => {
  const screen = await customRender(
    <SettingsNumberInput unit="분" aria-label="순회 간격" placeholder="비우면 한 번만" />,
  );

  await expect
    .element(screen.getByLabelText('순회 간격'))
    .toHaveAttribute('placeholder', '비우면 한 번만');
});
