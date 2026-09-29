import { expect, test, vi } from 'vitest';
import StartButton from './StartButton';
import { customRender } from '../customRender';

test('버튼을 클릭하면 onClick이 호출된다', async () => {
  const handleClick = vi.fn();
  const screen = await customRender(<StartButton onClick={handleClick} isLoading={false} />);

  await screen.getByRole('button', { name: '자동 수정 시작' }).click();

  expect(handleClick).toHaveBeenCalledOnce();
});

test('isLoading이 true면 버튼이 비활성화된다', async () => {
  const screen = await customRender(<StartButton onClick={vi.fn()} isLoading={true} />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeDisabled();
});

test('isLoading이 false면 버튼이 활성화되어 있다', async () => {
  const screen = await customRender(<StartButton onClick={vi.fn()} isLoading={false} />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).not.toBeDisabled();
});
