import { expect, test } from 'vitest';
import SettingsToggle from './SettingsToggle';
import { customRender } from '../customRender';

test('꺼져 있으면 체크 해제 상태와 꺼짐을 보여준다', async () => {
  const screen = await customRender(<SettingsToggle isChecked={false} />);

  await expect.element(screen.getByRole('switch')).not.toBeChecked();
  await expect.element(screen.getByText('꺼짐')).toBeVisible();
});

test('켜져 있으면 체크 상태와 켜짐을 보여준다', async () => {
  const screen = await customRender(<SettingsToggle isChecked />);

  await expect.element(screen.getByRole('switch')).toBeChecked();
  await expect.element(screen.getByText('켜짐')).toBeVisible();
});
