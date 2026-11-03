export interface UpdateScheduler {
  isUpdateBlocked: () => boolean;
  lockUpdate: () => void;
  unlockUpdate: () => void;
  scheduleRestart: (delayMilliseconds: number, restart: () => void, onCancel: () => void) => void;
  cancelRestart: () => void;
}

/**
 * startUpdate, stopUpdate가 함께 참고하는 순회 중 여부와 예약한 재실행을 관리한다.
 * 두 핸들러가 같은 상태를 보도록 registerIpcHandlers에서 한 번만 만들어 함께 넘긴다.
 */
const createUpdateScheduler = (): UpdateScheduler => {
  // 순회가 도는 중에 startUpdate가 다시 들어오면 같은 page로 순회가 두 개 돌지 않도록 막는다.
  let isUpdateRunning = false;
  // 재실행을 기다리는 중에 startUpdate가 들어오면 막고, cancelRestart가 들어오면 취소하도록 타이머를 보관한다.
  let restartTimer: ReturnType<typeof setTimeout> | null = null;
  // 취소하면 예약한 쪽이 정한 동작(재실행 시각 지우기)을 한다.
  let onRestartCancel: (() => void) | null = null;

  const isUpdateBlocked = (): boolean => isUpdateRunning || restartTimer !== null;

  const lockUpdate = (): void => {
    isUpdateRunning = true;
  };

  const unlockUpdate = (): void => {
    isUpdateRunning = false;
  };

  const scheduleRestart: UpdateScheduler['scheduleRestart'] = (
    delayMilliseconds,
    restart,
    onCancel,
  ) => {
    restartTimer = setTimeout(() => {
      // restart 안에서 다시 시작하는 순회가 이 예약에 막히지 않도록 예약부터 지운다.
      restartTimer = null;
      onRestartCancel = null;

      restart();
    }, delayMilliseconds);

    onRestartCancel = onCancel;
  };

  // 순회 중에는 예약한 재실행이 없어 아무것도 하지 않는다.
  const cancelRestart = (): void => {
    if (restartTimer === null) {
      return;
    }

    clearTimeout(restartTimer);
    restartTimer = null;
    onRestartCancel?.();
    onRestartCancel = null;
  };

  return { isUpdateBlocked, lockUpdate, unlockUpdate, scheduleRestart, cancelRestart };
};

export default createUpdateScheduler;
