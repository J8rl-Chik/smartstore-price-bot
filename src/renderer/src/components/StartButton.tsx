import styled from 'styled-components';

interface Props {
  onClick: () => void;
  isLoading: boolean;
}

const StartButtonContainer = styled.button`
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.color.white};
  cursor: pointer;
  background: ${({ theme }) => theme.color.blue500};
  border: none;
  border-radius: 8px;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.color.blue600};
  }

  &:disabled {
    cursor: not-allowed;
    background: ${({ theme }) => theme.color.gray300};
  }
`;

const StartButton = ({ onClick, isLoading }: Props): React.JSX.Element => {
  return (
    <StartButtonContainer onClick={onClick} disabled={isLoading}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M3 2l7 4-7 4V2z" fill="white" />
      </svg>
      자동 수정 시작
    </StartButtonContainer>
  );
};

export default StartButton;
