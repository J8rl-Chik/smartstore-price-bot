import { expect, test } from 'vitest';
import SettingsPage from './SettingsPage';
import { customRender } from '../customRender';

test('사용자 설정 제목을 보여준다', async () => {
  const screen = await customRender(<SettingsPage />);

  await expect
    .element(screen.getByRole('heading', { level: 2, name: '사용자 설정' }))
    .toBeVisible();
});
