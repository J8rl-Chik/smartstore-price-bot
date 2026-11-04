import { expect, test } from 'vitest';
import SettingsField, { SettingsInput } from './SettingsField';
import { customRender } from '../customRender';

test('label로 입력 요소를 찾을 수 있다', async () => {
  const screen = await customRender(
    <SettingsField label="네이버 아이디">
      <SettingsInput placeholder="아이디 입력" />
    </SettingsField>,
  );

  await expect
    .element(screen.getByLabelText('네이버 아이디'))
    .toHaveAttribute('placeholder', '아이디 입력');
});
