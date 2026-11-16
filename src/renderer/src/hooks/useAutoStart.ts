import { useEffect, useState } from 'react';
import tryCatch from '../../../utils/tryCatch';
import hasRequiredSettings from '../domain/hasRequiredSettings';
import { readSettings } from '../domain/settingsStorage';

interface AutoStart {
  // 자동 시작을 예약한 시각(Date.now() 기준 ms). 예약이 없으면 null
  autoStartAt: number | null;
  cancelAutoStart: () => void;
}

/**
 * Windows 시작 프로그램으로 켜졌으면, 저장한 시작 대기 시간(분)이 지난 뒤 가격 수정을 시작한다.
 * 사람이 바로가기로 켰거나 필수 설정이 없으면 예약하지 않는다. 읽지 못하면 바로가기로 켠 것으로 본다.
 * 시작은 시작 버튼과 같은 startUpdate 요청으로 하고, 설정은 시작하는 시점에 저장해 둔 값을 읽는다.
 */
const useAutoStart = (): AutoStart => {
  const [autoStartAt, setAutoStartAt] = useState<number | null>(null);

  // 앱이 뜰 때 한 번만 예약한다. 확인하기 전에 화면이 사라지면 예약하지 않는다.
  useEffect(() => {
    let isActive = true;

    const scheduleAutoStart = async (): Promise<void> => {
      const [error, isOpenedAtLogin] = await tryCatch(window.api.isOpenedAtLogin());
      const settings = readSettings();

      if (!isActive || error || !isOpenedAtLogin || !hasRequiredSettings(settings)) {
        return;
      }

      setAutoStartAt(Date.now() + settings.autoStartDelayMinutes * 60 * 1000);
    };

    void scheduleAutoStart();

    return () => {
      isActive = false;
    };
  }, []);

  // 예약 시각이 되면 시작한다. 취소하거나 화면이 사라지면 타이머를 지운다.
  useEffect(() => {
    if (autoStartAt === null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setAutoStartAt(null);
      void window.api.startUpdate(readSettings());
    }, autoStartAt - Date.now());

    return () => clearTimeout(timeoutId);
  }, [autoStartAt]);

  const cancelAutoStart = (): void => {
    setAutoStartAt(null);
  };

  return { autoStartAt, cancelAutoStart };
};

export default useAutoStart;
