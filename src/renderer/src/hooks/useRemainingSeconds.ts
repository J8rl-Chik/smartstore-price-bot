import { useEffect, useState } from 'react';

// 남은 시간을 올림해, 1초 미만으로 남아도 0초가 되기 전까지는 1초로 보여준다.
const calculateRemainingSeconds = (targetTime: number): number =>
  Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));

/**
 * targetTime(Date.now() 기준 ms)까지 남은 초를 1초마다 다시 계산한다.
 * targetTime이 바뀌어도 남은 초를 다시 계산하지 않으므로, 쓰는 쪽에서 key={targetTime}으로 새로 마운트한다.
 */
const useRemainingSeconds = (targetTime: number): number => {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(targetTime),
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setRemainingSeconds(calculateRemainingSeconds(targetTime));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [targetTime]);

  return remainingSeconds;
};

export default useRemainingSeconds;
