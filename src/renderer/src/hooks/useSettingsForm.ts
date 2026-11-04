import { useState } from 'react';
import parseProductDelay from '../domain/parseProductDelay';
import parseRestartDelay from '../domain/parseRestartDelay';
import { readSettings, saveSettings } from '../domain/settingsStorage';
import type { Settings } from '../../../domain/settings/_type';

// 숫자 입력칸은 비우거나 잘못 입력한 값도 들고 있어야 하므로, 저장 전까지 문자열로 다룬다.
type SettingsForm = Omit<Settings, 'restartDelayMinutes' | 'productDelaySeconds'> & {
  restartDelayMinutes: string;
  productDelaySeconds: string;
};

// 입력칸별 검사 실패 이유. 통과했으면 null
interface SettingsFormErrorMessages {
  restartDelayMinutes: string | null;
  productDelaySeconds: string | null;
}

interface SettingsFormState {
  form: SettingsForm;
  errorMessages: SettingsFormErrorMessages;
  changeSettingsForm: <Field extends keyof SettingsForm>(
    field: Field,
    value: SettingsForm[Field],
  ) => void;
  saveSettingsForm: () => void;
}

const initialErrorMessages: SettingsFormErrorMessages = {
  restartDelayMinutes: null,
  productDelaySeconds: null,
};

const createSettingsForm = (settings: Settings): SettingsForm => ({
  ...settings,
  restartDelayMinutes: settings.restartDelayMinutes?.toString() ?? '',
  productDelaySeconds: settings.productDelaySeconds.toString(),
});

// 저장한 설정으로 입력 상태를 시작하고, 저장할 때 검사를 통과한 값만 숫자로 바꿔 저장한다.
const useSettingsForm = (): SettingsFormState => {
  const [form, setForm] = useState(() => createSettingsForm(readSettings()));
  const [errorMessages, setErrorMessages] = useState(initialErrorMessages);

  const changeSettingsForm: SettingsFormState['changeSettingsForm'] = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const saveSettingsForm = (): void => {
    const parsedRestartDelay = parseRestartDelay(form.restartDelayMinutes);
    const parsedProductDelay = parseProductDelay(form.productDelaySeconds);

    setErrorMessages({
      restartDelayMinutes: parsedRestartDelay.isValid ? null : parsedRestartDelay.errorMessage,
      productDelaySeconds: parsedProductDelay.isValid ? null : parsedProductDelay.errorMessage,
    });

    if (!parsedRestartDelay.isValid || !parsedProductDelay.isValid) {
      return;
    }

    saveSettings({
      ...form,
      restartDelayMinutes: parsedRestartDelay.restartDelayMinutes,
      productDelaySeconds: parsedProductDelay.productDelaySeconds,
    });
  };

  return { form, errorMessages, changeSettingsForm, saveSettingsForm };
};

export default useSettingsForm;
