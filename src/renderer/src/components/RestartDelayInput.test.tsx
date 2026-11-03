import { expect, test, vi } from 'vitest';
import RestartDelayInput from './RestartDelayInput';
import { customRender } from '../customRender';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';

test('입력하면 입력한 값으로 onChange가 호출된다', async () => {
  const handleChange = vi.fn();
  const screen = await customRender(
    <RestartDelayInput value="" onChange={handleChange} errorMessage={null} isDisabled={false} />,
  );

  await screen.getByLabelText('재실행 간격(분)').fill('30');

  expect(handleChange).toHaveBeenLastCalledWith('30');
});

test('실패 이유가 있으면 보여준다', async () => {
  const screen = await customRender(
    <RestartDelayInput
      value="5"
      onChange={vi.fn()}
      errorMessage={ERROR_MESSAGE.RESTART_DELAY_TOO_SHORT}
      isDisabled={false}
    />,
  );

  await expect.element(screen.getByText(ERROR_MESSAGE.RESTART_DELAY_TOO_SHORT)).toBeVisible();
});

test('isDisabled가 true면 입력창이 비활성화된다', async () => {
  const screen = await customRender(
    <RestartDelayInput value="" onChange={vi.fn()} errorMessage={null} isDisabled={true} />,
  );

  await expect.element(screen.getByLabelText('재실행 간격(분)')).toBeDisabled();
});
