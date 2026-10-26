import { expect, test } from 'vitest';
import StartUpdateErrorBanner from './StartUpdateErrorBanner';
import { customRender } from '../customRender';

test('전달받은 실패 이유를 alert로 보여준다', async () => {
  const screen = await customRender(
    <StartUpdateErrorBanner message="네이버 로그인에 실패했습니다." />,
  );

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('네이버 로그인에 실패했습니다.');
});
