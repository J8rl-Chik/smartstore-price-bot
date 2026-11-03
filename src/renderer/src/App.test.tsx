import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import App from './App';
import type { TargetProductWithUpdate, UpdateState } from '../../domain/product/_type';
import type { IpcInvoke, IpcListener } from '../../preload/_type';

const mockStartUpdate = vi.fn<IpcInvoke['startUpdate']>();
const mockStopUpdate = vi.fn<IpcInvoke['stopUpdate']>();
const mockOnUpdateState = vi.fn<IpcListener['onUpdateState']>();

window.api = {
  startUpdate: mockStartUpdate,
  stopUpdate: mockStopUpdate,
  onUpdateState: mockOnUpdateState,
};

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

const updateState: UpdateState = {
  targetProducts: [
    createTargetProduct(),
    createTargetProduct({ name: '블루투스 스피커 미니', originProductNo: 2 }),
  ],
  invalidProductRows: [{ name: '무선 충전기', errorMessages: ['productPrice: 숫자가 아닙니다.'] }],
  currentIndex: null,
  isPreparing: false,
  isRunning: false,
  errorMessage: null,
  nextRunAt: null,
};

// 구독하자마자 main이 state를 보낸 것처럼 콜백을 바로 호출한다.
const mockSentUpdateState = (state: UpdateState): void => {
  mockOnUpdateState.mockImplementation((callback) => {
    callback(state);
    return vi.fn();
  });
};

beforeEach(() => {
  vi.resetAllMocks();

  mockSentUpdateState(updateState);
});

test('main이 실패 이유를 보내면 에러 배너, 변환 실패 배너, 상품 목록을 함께 보여준다', async () => {
  mockSentUpdateState({ ...updateState, errorMessage: '스프레드시트 조회 실패' });

  const screen = await render(<App />);

  await expect.element(screen.getByText('스프레드시트 조회 실패')).toBeVisible();
  await expect.element(screen.getByText('무선 충전기')).toBeVisible();
  await expect.element(screen.getByText('블루투스 스피커 미니')).toBeVisible();
});

test('준비 중이면 시작 버튼이 비활성화된다', async () => {
  mockSentUpdateState({ ...updateState, isPreparing: true });

  const screen = await render(<App />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeDisabled();
});

test('순회 중이면 시작 버튼이 비활성화된다', async () => {
  mockSentUpdateState({ ...updateState, currentIndex: 0, isRunning: true });

  const screen = await render(<App />);

  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeDisabled();
});

test('재실행을 기다리는 중이면 남은 시간을 보여주고 시작 버튼이 비활성화된다', async () => {
  mockSentUpdateState({ ...updateState, nextRunAt: Date.now() + 30 * 60 * 1000 });

  const screen = await render(<App />);

  await expect.element(screen.getByRole('status')).toHaveTextContent('다음 자동 수정까지 30:00');
  await expect.element(screen.getByRole('button', { name: '자동 수정 시작' })).toBeDisabled();
});

test('예약한 재실행이 없으면 남은 시간을 보여주지 않는다', async () => {
  const screen = await render(<App />);

  await expect.element(screen.getByRole('status')).not.toBeInTheDocument();
});
