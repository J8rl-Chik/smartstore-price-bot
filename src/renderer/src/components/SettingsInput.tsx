import styled from 'styled-components';

const SettingsInput = styled.input`
  width: 100%;
  height: 44px;
  padding: 0 14px;
  font-size: 14px;
  color: ${({ theme }) => theme.color.gray900};
  background: ${({ theme }) => theme.color.gray50};
  border: 1px solid ${({ theme }) => theme.color.gray200};
  border-radius: 10px;

  &::placeholder {
    color: ${({ theme }) => theme.color.gray400};
  }

  &[type='file'] {
    padding: 8px 14px;
  }
`;

export default SettingsInput;
