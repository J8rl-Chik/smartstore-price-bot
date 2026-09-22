import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  // 그라디언트가 오른쪽 -> 왼쪽으로 이동.
  0% {
    background-position: 150% 0;
  }
  100% {
    background-position: -50% 0;
  }
`;

const ProgressContainer = styled.div`
  margin-bottom: 24px;
`;

const StatusRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const StatusText = styled.span`
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  color: ${({ theme }) => theme.color.gray600};

  &::before {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    content: '';
    background: ${({ theme }) => theme.color.gray400};
    border-radius: 50%;
  }
`;

const ProgressCount = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.color.gray500};
`;

const ProgressTrack = styled.progress`
  display: block;
  width: 100%;
  height: 8px;
  overflow: hidden;
  appearance: none;
  border: none;
  border-radius: 4px;

  &::-webkit-progress-bar {
    background: ${({ theme }) => theme.color.gray100};
    border-radius: 4px;
  }

  &::-webkit-progress-value {
    background-color: ${({ theme }) => theme.color.blue500};
    /* 배경 색상 위에 그라디언트 그리기. */
    background-image: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.35) 50%,
      transparent 100%
    );
    background-repeat: no-repeat; /* value 값이 바뀔 때 부드럽게 조정되도록 설정. */
    background-size: 50% 100%; /* value 너비에 맞춰 크기 계산. */
    border-radius: 4px;
    transition: width 0.2s;
    animation: ${shimmer} 1.5s ease-in-out infinite;
  }
`;

const ProgressBar = (): React.JSX.Element => {
  const total = 108;
  const checked = 63;

  return (
    <ProgressContainer>
      <StatusRow>
        <StatusText>대기 중</StatusText>
        <ProgressCount>
          {checked} / {total} 확인 중
        </ProgressCount>
      </StatusRow>
      <ProgressTrack value={checked} max={total} />
    </ProgressContainer>
  );
};

export default ProgressBar;
