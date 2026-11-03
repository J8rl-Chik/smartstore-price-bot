import type { IpcInvoke } from '../preload/_type';
import type { UpdateScheduler } from './updateScheduler';

// 예약한 재실행을 취소하는 stopUpdate 핸들러를 만든다. startUpdate와 같은 scheduler를 받아야 그 예약을 취소할 수 있다.
const createStopUpdate =
  (scheduler: UpdateScheduler): IpcInvoke['stopUpdate'] =>
  async () => {
    scheduler.cancelRestart();
  };

export default createStopUpdate;
