import styled from 'styled-components';

interface SettingsToggleProps {
  isChecked: boolean;
}

const SettingsToggleContainer = styled.span`
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ToggleInput = styled.input`
  position: absolute;
  opacity: 0;
`;

const ToggleTrack = styled.span`
  position: relative;
  width: 44px;
  height: 24px;
  background: ${({ theme }) => theme.color.gray400};
  border-radius: 12px;
  transition: background 0.15s;

  &::after {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    content: '';
    background: ${({ theme }) => theme.color.white};
    border-radius: 50%;
    transition: transform 0.15s;
  }

  ${ToggleInput}:checked + & {
    background: ${({ theme }) => theme.color.blue500};
  }

  ${ToggleInput}:checked + &::after {
    transform: translateX(20px);
  }
`;

// TODO: 설정 상태를 연결할 때 onChange를 받아 켜고 끌 수 있게 한다.
const SettingsToggle = ({ isChecked }: SettingsToggleProps): React.JSX.Element => (
  <SettingsToggleContainer>
    <ToggleInput type="checkbox" role="switch" checked={isChecked} readOnly />
    <ToggleTrack />
    {isChecked ? '켜짐' : '꺼짐'}
  </SettingsToggleContainer>
);

export default SettingsToggle;
