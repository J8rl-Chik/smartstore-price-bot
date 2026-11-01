import { beforeEach, expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import App from './App';
import type { TargetProductWithUpdate, UpdateState } from '../../domain/product/_type';
import type { IpcInvoke, IpcListener } from '../../preload/_type';

const mockStartUpdate = vi.fn<IpcInvoke['startUpdate']>();
const mockOnUpdateState = vi.fn<IpcListener['onUpdateState']>();

window.api = {
  startUpdate: mockStartUpdate,
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
  currentIndex: 0,
  isPreparing: false,
  isRunning: true,
};

beforeEach(() => {
  vi.resetAllMocks();

  // 구독하자마자 main이 상태를 보낸 것처럼 콜백을 바로 호출한다.
  mockOnUpdateState.mockImplementation((callback) => {
    callback(updateState);
    return vi.fn();
  });
  mockStartUpdate.mockResolvedValue({ status: 'error', message: '스프레드시트 조회 실패' });
});

test('시작에 실패하면 에러 배너, 변환 실패 배너, 상품 목록을 함께 보여준다', async () => {
  const screen = await render(<App />);

  await screen.getByRole('button', { name: '자동 수정 시작' }).click();

  await expect.element(screen.getByText('스프레드시트 조회 실패')).toBeVisible();
  await expect.element(screen.getByText('무선 충전기')).toBeVisible();
  await expect.element(screen.getByText('블루투스 스피커 미니')).toBeVisible();
});
