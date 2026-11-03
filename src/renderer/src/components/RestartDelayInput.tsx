import styled from 'styled-components';
import { MIN_RESTART_DELAY_MINUTES } from '../domain/parseRestartDelay';

interface RestartDelayInputProps {
  value: string;
  onChange: (value: string) => void;
  // 입력이 잘못됐을 때만 있는 실패 이유. 없으면 null
  errorMessage: string | null;
  isDisabled: boolean;
}

const RestartDelayInputContainer = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 14px;
  color: ${({ theme }) => theme.color.gray700};
`;

const Input = styled.input`
  width: 120px;
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
  border: 1px solid ${({ theme }) => theme.color.gray300};
  border-radius: 8px;

  &:disabled {
    background: ${({ theme }) => theme.color.gray100};
  }
`;

const ErrorMessage = styled.p`
  margin-top: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.color.red600};
`;

// 비워 두면 자동 재실행 없이 한 번만 순회한다.
const RestartDelayInput = ({
  value,
  onChange,
  errorMessage,
  isDisabled,
}: RestartDelayInputProps): React.JSX.Element => (
  <RestartDelayInputContainer>
    <Label>
      재실행 간격(분)
      <Input
        type="number"
        min={MIN_RESTART_DELAY_MINUTES}
        step={1}
        placeholder="비우면 한 번만"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={isDisabled}
      />
    </Label>
    {errorMessage !== null && <ErrorMessage>{errorMessage}</ErrorMessage>}
  </RestartDelayInputContainer>
);

export default RestartDelayInput;
