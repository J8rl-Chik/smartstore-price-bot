import { useState } from 'react';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import parseProductDelay from '../domain/parseProductDelay';
import parseRestartDelay from '../domain/parseRestartDelay';
import { readSettings, saveSettings } from '../domain/settingsStorage';
import type { Settings } from '../../../domain/settings/_type';

// 숫자 입력칸은 비우거나 잘못 입력한 값도 들고 있어야 하므로, 저장 전까지 문자열로 다룬다.
type SettingsForm = Omit<Settings, 'restartDelayMinutes' | 'productDelaySeconds'> & {
  restartDelayMinutes: string;
  productDelaySeconds: string;
};

/**
 * 입력 중인 평문 비밀값. 저장할 때 form을 그대로 펼쳐 넣으므로, 평문이 localStorage에 섞이지 않도록 form과 나눠 둔다.
 * 비어 있으면 새로 입력하지 않은 것으로 보고 저장해 둔 암호문을 유지한다.
 */
interface SecretInputs {
  naverPassword: string;
  clientSecret: string;
  serviceAccountKey: string;
}

// 입력칸별 검사 실패 이유. 통과했으면 null
interface SettingsFormErrorMessages {
  restartDelayMinutes: string | null;
  productDelaySeconds: string | null;
}

interface SettingsFormState {
  form: SettingsForm;
  secretInputs: SecretInputs;
  errorMessages: SettingsFormErrorMessages;
  // 암호화에 실패해 저장하지 못한 이유. 없으면 null
  saveErrorMessage: string | null;
  changeSettingsForm: <Field extends keyof SettingsForm>(
    field: Field,
    value: SettingsForm[Field],
  ) => void;
  changeSecretInput: (field: keyof SecretInputs, value: string) => void;
  saveSettingsForm: () => Promise<void>;
}

const initialSecretInputs: SecretInputs = {
  naverPassword: '',
  clientSecret: '',
  serviceAccountKey: '',
};

const initialErrorMessages: SettingsFormErrorMessages = {
  restartDelayMinutes: null,
  productDelaySeconds: null,
};

const createSettingsForm = (settings: Settings): SettingsForm => ({
  ...settings,
  restartDelayMinutes: settings.restartDelayMinutes?.toString() ?? '',
  productDelaySeconds: settings.productDelaySeconds.toString(),
});

// 새로 입력한 비밀값만 암호화하고, 입력하지 않았으면 저장해 둔 암호문을 그대로 돌려준다.
const encryptSecretInput = async (secret: string, encryptedSecret: string): Promise<string> =>
  secret === '' ? encryptedSecret : window.api.encryptSecret(secret);

/**
 * 저장한 설정으로 입력 상태를 시작하고, 저장할 때 검사를 통과한 값만 숫자로 바꿔 저장한다.
 * 비밀값은 암호문만 저장한다. 하나라도 암호화에 실패하면 아무것도 저장하지 않는다.
 */
const useSettingsForm = (): SettingsFormState => {
  const [form, setForm] = useState(() => createSettingsForm(readSettings()));
  const [secretInputs, setSecretInputs] = useState(initialSecretInputs);
  const [errorMessages, setErrorMessages] = useState(initialErrorMessages);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const changeSettingsForm: SettingsFormState['changeSettingsForm'] = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const changeSecretInput: SettingsFormState['changeSecretInput'] = (field, value) => {
    setSecretInputs((currentInputs) => ({ ...currentInputs, [field]: value }));
  };

  const saveSettingsForm = async (): Promise<void> => {
    const parsedRestartDelay = parseRestartDelay(form.restartDelayMinutes);
    const parsedProductDelay = parseProductDelay(form.productDelaySeconds);

    setSaveErrorMessage(null);
    setErrorMessages({
      restartDelayMinutes: parsedRestartDelay.isValid ? null : parsedRestartDelay.errorMessage,
      productDelaySeconds: parsedProductDelay.isValid ? null : parsedProductDelay.errorMessage,
    });

    if (!parsedRestartDelay.isValid || !parsedProductDelay.isValid) {
      return;
    }

    try {
      const [encryptedNaverPassword, encryptedClientSecret, encryptedServiceAccountKey] =
        await Promise.all([
          encryptSecretInput(secretInputs.naverPassword, form.encryptedNaverPassword),
          encryptSecretInput(secretInputs.clientSecret, form.encryptedClientSecret),
          encryptSecretInput(secretInputs.serviceAccountKey, form.encryptedServiceAccountKey),
        ]);
      const encryptedSecrets = {
        encryptedNaverPassword,
        encryptedClientSecret,
        encryptedServiceAccountKey,
      };

      saveSettings({
        ...form,
        ...encryptedSecrets,
        restartDelayMinutes: parsedRestartDelay.restartDelayMinutes,
        productDelaySeconds: parsedProductDelay.productDelaySeconds,
      });
      setForm((currentForm) => ({ ...currentForm, ...encryptedSecrets }));
      setSecretInputs(initialSecretInputs);
    } catch {
      // IPC 에러 메시지에는 Electron이 채널 정보를 덧붙이므로, 화면에는 정해 둔 메시지를 보여준다.
      setSaveErrorMessage(ERROR_MESSAGE.ENCRYPTION_UNAVAILABLE);
    }
  };

  return {
    form,
    secretInputs,
    errorMessages,
    saveErrorMessage,
    changeSettingsForm,
    changeSecretInput,
    saveSettingsForm,
  };
};

export default useSettingsForm;
