import type { ComponentPropsWithoutRef } from 'react';
import styled from 'styled-components';
import { SettingsInput } from './SettingsField';

interface SettingsNumberInputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type'> {
  unit: string;
}

const SettingsNumberInputContainer = styled.span`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const NumberInput = styled(SettingsInput)`
  width: 140px;
  text-align: right;
`;

const SettingsNumberInput = ({
  unit,
  ...inputProps
}: SettingsNumberInputProps): React.JSX.Element => (
  <SettingsNumberInputContainer>
    <NumberInput type="number" {...inputProps} />
    {unit}
  </SettingsNumberInputContainer>
);

export default SettingsNumberInput;
