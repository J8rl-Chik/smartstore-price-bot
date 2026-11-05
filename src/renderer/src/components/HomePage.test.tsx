import type { ComponentProps } from 'react';
import { beforeEach, expect, test, vi } from 'vitest';
import HomePage from './HomePage';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import { customRender } from '../customRender';
import type { TargetProductWithUpdate } from '../../../domain/product/_type';

const mockOnStartUpdate = vi.fn<() => void>();
const mockOnStopUpdate = vi.fn<() => void>();

const createTargetProduct = (
  overrides: Partial<TargetProductWithUpdate> = {},
): TargetProductWithUpdate => ({
  name: '무선 이어폰 프로',
  originProductNo: 1,
  store: {
    salePrice: 42900,
    stockQuantity: 10,
    deliveryFee: 0,
  },
  sheet: {
    catalogURL: 'https://catalog.example/1',
    delivery: { feeType: '무료' },
    freeDeliveryPrice: 0,
    productPrice: 42900,
    virtualPrice: null,
    excludedSellerNames: [],
  },
  update: { status: 'wait' },
  ...overrides,
});

const homePageProps: ComponentProps<typeof HomePage> = {
  targetProducts: [
    createTargetProduct(),
    createTargetProduct({ name: '블루투스 스피커 미니', originProductNo: 2 }),
  ],
  invalidProductRows: [{ name: '무선 충전기', errorMessages: ['productPrice: 숫자가 아닙니다.'] }],
  isPreparing: false,
  isRunning: false,
  currentProduct: undefined,
  currentOrder: 0,
  errorMessage: null,
  nextRunAt: null,
  hasSettings: true,
  onStartUpdate: mockOnStartUpdate,
  onStopUpdate: mockOnStopUpdate,
};

beforeEach(() => {
  vi.resetAllMocks();
});

test('실패 이유가 있으면 에러 배너, 변환 실패 배너, 상품 목록을 함께 보여준다', async () => {
  const screen = await customRender(
    <HomePage {...homePageProps} errorMessage="스프레드시트 조회 실패" />,
  );

  await expect.element(screen.getByText('스프레드시트 조회 실패')).toBeVisible();
  await expect.element(screen.getByText('무선 충전기')).toBeVisible();
  await expect.element(screen.getByText('블루투스 스피커 미니')).toBeVisible();
});

test('준비 중이면 시작 버튼이 비활성화된다', async () => {
  const screen = await customRender(<HomePage {...homePageProps} isPreparing />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeDisabled();
});

test('순회 중이면 시작 버튼이 비활성화된다', async () => {
  const screen = await customRender(<HomePage {...homePageProps} isRunning />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeDisabled();
});

test('재실행을 기다리는 중이면 남은 시간과 중지 버튼을 보여주고, 시작 버튼이 비활성화된다', async () => {
  const screen = await customRender(
    <HomePage {...homePageProps} nextRunAt={Date.now() + 30 * 60 * 1000} />,
  );

  await expect.element(screen.getByRole('status')).toHaveTextContent('다음 자동 수정까지 30:00');
  await expect.element(screen.getByRole('button', { name: '자동 재실행 중지' })).toBeVisible();
  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeDisabled();
});

test('예약한 재실행이 없으면 남은 시간과 중지 버튼을 보여주지 않는다', async () => {
  const screen = await customRender(<HomePage {...homePageProps} />);

  await expect.element(screen.getByRole('status')).not.toBeInTheDocument();
  await expect
    .element(screen.getByRole('button', { name: '자동 재실행 중지' }))
    .not.toBeInTheDocument();
});

test('시작 버튼을 클릭하면 onStartUpdate를 호출한다', async () => {
  const screen = await customRender(<HomePage {...homePageProps} />);

  await screen.getByRole('button', { name: '자동 수정 시작' }).click();

  expect(mockOnStartUpdate).toHaveBeenCalledOnce();
});

test('중지 버튼을 클릭하면 onStopUpdate를 호출한다', async () => {
  const screen = await customRender(
    <HomePage {...homePageProps} nextRunAt={Date.now() + 30 * 60 * 1000} />,
  );

  await screen.getByRole('button', { name: '자동 재실행 중지' }).click();

  expect(mockOnStopUpdate).toHaveBeenCalledOnce();
});

test('필수 설정이 없으면 시작을 막고 안내를 보여준다', async () => {
  const screen = await customRender(<HomePage {...homePageProps} hasSettings={false} />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeDisabled();
  await expect.element(screen.getByText(ERROR_MESSAGE.SETTINGS_REQUIRED)).toBeVisible();
});

test('필수 설정이 있으면 안내를 보여주지 않는다', async () => {
  const screen = await customRender(<HomePage {...homePageProps} />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeEnabled();
  await expect.element(screen.getByText(ERROR_MESSAGE.SETTINGS_REQUIRED)).not.toBeInTheDocument();
});
