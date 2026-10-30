import styled from 'styled-components';

interface Props {
  onClick: () => void;
  isPreparing: boolean;
}

const StartButtonContainer = styled.button`
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  margin-bottom: 24px;
  font-size: 17px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.white};
  cursor: pointer;
  background: ${({ theme }) => theme.color.blue500};
  border: none;
  border-radius: 16px;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.color.blue600};
  }

  &:disabled {
    cursor: not-allowed;
    background: ${({ theme }) => theme.color.gray300};
  }
`;

const StartButton = ({ onClick, isPreparing }: Props): React.JSX.Element => {
  return (
    <StartButtonContainer onClick={onClick} disabled={isPreparing}>
      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
        <path d="M3 2l7 4-7 4V2z" fill="white" />
      </svg>
      자동 수정 시작
    </StartButtonContainer>
  );
};

export default StartButton;
