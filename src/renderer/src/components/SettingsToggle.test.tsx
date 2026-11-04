import { expect, test, vi } from 'vitest';
import SettingsToggle from './SettingsToggle';
import { customRender } from '../customRender';

test('꺼져 있으면 체크 해제 상태와 꺼짐을 보여준다', async () => {
  const screen = await customRender(<SettingsToggle isChecked={false} onChange={vi.fn()} />);

  await expect.element(screen.getByRole('switch')).not.toBeChecked();
  await expect.element(screen.getByText('꺼짐')).toBeVisible();
});

test('켜져 있으면 체크 상태와 켜짐을 보여준다', async () => {
  const screen = await customRender(<SettingsToggle isChecked onChange={vi.fn()} />);

  await expect.element(screen.getByRole('switch')).toBeChecked();
  await expect.element(screen.getByText('켜짐')).toBeVisible();
});

test('클릭하면 onChange를 호출한다', async () => {
  const mockOnChange = vi.fn();
  const screen = await customRender(
    <label>
      테스트 모드
      <SettingsToggle isChecked={false} onChange={mockOnChange} />
    </label>,
  );

  await screen.getByText('꺼짐').click();

  expect(mockOnChange).toHaveBeenCalledOnce();
});
