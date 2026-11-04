import { expect, test } from 'vitest';
import SettingsSection from './SettingsSection';
import { customRender } from '../customRender';

test('제목과 설명을 보여준다', async () => {
  const screen = await customRender(
    <SettingsSection title="네이버 계정" description="네이버에 로그인할 때 사용해요." />,
  );

  await expect
    .element(screen.getByRole('heading', { level: 3, name: '네이버 계정' }))
    .toBeVisible();
  await expect.element(screen.getByText('네이버에 로그인할 때 사용해요.')).toBeVisible();
});

test('children을 보여준다', async () => {
  const screen = await customRender(
    <SettingsSection title="네이버 계정" description="네이버에 로그인할 때 사용해요.">
      <p>입력 항목</p>
    </SettingsSection>,
  );

  await expect.element(screen.getByText('입력 항목')).toBeVisible();
});
