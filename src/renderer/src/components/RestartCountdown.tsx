import styled from 'styled-components';
import formatRemainingTime from '../domain/formatRemainingTime';
import useRemainingSeconds from '../hooks/useRemainingSeconds';

interface RestartCountdownProps {
  // 재실행을 예약한 시각(Date.now() 기준 ms)
  nextRunAt: number;
  onStopUpdate: () => void;
}

const RestartCountdownContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: ${({ theme }) => theme.color.blue600};
  background: ${({ theme }) => theme.color.blue50};
  border: 1px solid ${({ theme }) => theme.color.blue100};
  border-radius: 10px;
`;

const StopButton = styled.button`
  height: 32px;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.blue600};
  cursor: pointer;
  background: ${({ theme }) => theme.color.white};
  border: 1px solid ${({ theme }) => theme.color.blue200};
  border-radius: 8px;

  &:hover {
    background: ${({ theme }) => theme.color.blue100};
  }
`;

// 재실행을 기다리는 동안에만 보이므로, 중지 버튼도 재실행을 예약했을 때만 보인다.
const RestartCountdown = ({
  nextRunAt,
  onStopUpdate,
}: RestartCountdownProps): React.JSX.Element => {
  const remainingSeconds = useRemainingSeconds(nextRunAt);

  return (
    <RestartCountdownContainer>
      <span role="status">다음 자동 수정까지 {formatRemainingTime(remainingSeconds)}</span>
      <StopButton onClick={onStopUpdate}>자동 재실행 중지</StopButton>
    </RestartCountdownContainer>
  );
};

export default RestartCountdown;
