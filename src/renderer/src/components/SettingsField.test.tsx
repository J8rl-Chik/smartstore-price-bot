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

test('실패 이유가 있으면 보여준다', async () => {
  const screen = await customRender(
    <SettingsField label="순회 간격" errorMessage="10분 이상으로 입력해주세요.">
      <SettingsInput />
    </SettingsField>,
  );

  await expect.element(screen.getByText('10분 이상으로 입력해주세요.')).toBeVisible();
});

test('실패 이유가 null이면 보여주지 않는다', async () => {
  const screen = await customRender(
    <SettingsField label="순회 간격" errorMessage={null}>
      <SettingsInput />
    </SettingsField>,
  );

  await expect.element(screen.getByText('입력해주세요')).not.toBeInTheDocument();
});
