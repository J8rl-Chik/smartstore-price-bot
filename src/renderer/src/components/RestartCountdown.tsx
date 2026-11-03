import styled from 'styled-components';
import formatRemainingTime from '../domain/formatRemainingTime';
import useRemainingSeconds from '../hooks/useRemainingSeconds';

interface RestartCountdownProps {
  // 재실행을 예약한 시각(Date.now() 기준 ms)
  nextRunAt: number;
}

const RestartCountdownContainer = styled.div`
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: ${({ theme }) => theme.color.blue600};
  background: ${({ theme }) => theme.color.blue50};
  border: 1px solid ${({ theme }) => theme.color.blue100};
  border-radius: 10px;
`;

const RestartCountdown = ({ nextRunAt }: RestartCountdownProps): React.JSX.Element => {
  const remainingSeconds = useRemainingSeconds(nextRunAt);

  return (
    <RestartCountdownContainer role="status">
      다음 자동 수정까지 {formatRemainingTime(remainingSeconds)}
    </RestartCountdownContainer>
  );
};

export default RestartCountdown;
