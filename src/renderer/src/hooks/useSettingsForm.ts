import { useEffect, useState } from 'react';
import { ERROR_MESSAGE } from '../../../domain/error/errorMessage';
import tryCatch from '../../../utils/tryCatch';
import parseAutoStartDelay from '../domain/parseAutoStartDelay';
import parseProductDelay from '../domain/parseProductDelay';
import parseRestartDelay from '../domain/parseRestartDelay';
import { readSettings, saveSettings } from '../domain/settingsStorage';
import type { Settings } from '../../../domain/settings/_type';

// 숫자 입력칸은 비우거나 잘못 입력한 값도 들고 있어야 하므로, 저장 전까지 문자열로 다룬다.
type SettingsForm = Omit<
  Settings,
  'restartDelayMinutes' | 'productDelaySeconds' | 'autoStartDelayMinutes'
> & {
  restartDelayMinutes: string;
  productDelaySeconds: string;
  autoStartDelayMinutes: string;
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
  autoStartDelayMinutes: string | null;
}

interface SettingsFormState {
  form: SettingsForm;
  secretInputs: SecretInputs;
  // Windows 시작 시 자동 실행 토글. 저장하기 전까지는 화면에서만 바뀐다.
  isOpenAtLogin: boolean;
  errorMessages: SettingsFormErrorMessages;
  // 암호화나 시작 프로그램 등록에 실패한 이유. 없으면 null
  saveErrorMessage: string | null;
  changeSettingsForm: <Field extends keyof SettingsForm>(
    field: Field,
    value: SettingsForm[Field],
  ) => void;
  changeSecretInput: (field: keyof SecretInputs, value: string) => void;
  changeOpenAtLogin: (isEnabled: boolean) => void;
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
  autoStartDelayMinutes: null,
};

const createSettingsForm = (settings: Settings): SettingsForm => ({
  ...settings,
  restartDelayMinutes: settings.restartDelayMinutes?.toString() ?? '',
  productDelaySeconds: settings.productDelaySeconds.toString(),
  autoStartDelayMinutes: settings.autoStartDelayMinutes.toString(),
});

// 새로 입력한 비밀값만 암호화하고, 입력하지 않았으면 저장해 둔 암호문을 그대로 돌려준다.
const encryptSecretInput = async (secret: string, encryptedSecret: string): Promise<string> =>
  secret === '' ? encryptedSecret : window.api.encryptSecret(secret);

/**
 * 저장한 설정으로 입력 상태를 시작하고, 저장할 때 검사를 통과한 값만 숫자로 바꿔 저장한다.
 * 비밀값은 암호문만 저장한다. 하나라도 암호화에 실패하면 아무것도 저장하지 않는다.
 * 시작 프로그램 등록 여부는 localStorage가 아니라 Windows 레지스트리가 기준이라, 처음 값은 main에 물어 가져오고 저장할 때 main에 반영한다.
 */
const useSettingsForm = (): SettingsFormState => {
  const [form, setForm] = useState(() => createSettingsForm(readSettings()));
  const [secretInputs, setSecretInputs] = useState(initialSecretInputs);
  const [isOpenAtLogin, setIsOpenAtLogin] = useState(false);
  const [errorMessages, setErrorMessages] = useState(initialErrorMessages);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  /**
   * 레지스트리 값은 비동기로 받아 오므로 처음에는 꺼짐으로 보인다.
   * 받기 전에 화면을 벗어나면 사라진 컴포넌트의 상태를 바꾸지 않도록 무시한다. 읽지 못하면 꺼짐으로 둔다.
   */
  useEffect(() => {
    let isActive = true;

    const loadOpenAtLogin = async (): Promise<void> => {
      const [error, isEnabled] = await tryCatch(window.api.isOpenAtLoginEnabled());

      if (isActive && !error) {
        setIsOpenAtLogin(isEnabled);
      }
    };

    void loadOpenAtLogin();

    return () => {
      isActive = false;
    };
  }, []);

  const changeSettingsForm: SettingsFormState['changeSettingsForm'] = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const changeSecretInput: SettingsFormState['changeSecretInput'] = (field, value) => {
    setSecretInputs((currentInputs) => ({ ...currentInputs, [field]: value }));
  };

  const changeOpenAtLogin: SettingsFormState['changeOpenAtLogin'] = (isEnabled) => {
    setIsOpenAtLogin(isEnabled);
  };

  const saveSettingsForm = async (): Promise<void> => {
    const parsedRestartDelay = parseRestartDelay(form.restartDelayMinutes);
    const parsedProductDelay = parseProductDelay(form.productDelaySeconds);
    /**
     * 자동 실행을 끈 상태에서는 입력칸이 보이지 않으므로 검사하지 않고, 저장해 둔 값을 유지한다.
     * 다시 켜면 그 값으로 시작한다.
     */
    const parsedAutoStartDelay = isOpenAtLogin
      ? parseAutoStartDelay(form.autoStartDelayMinutes)
      : ({ isValid: true, autoStartDelayMinutes: readSettings().autoStartDelayMinutes } as const);

    setSaveErrorMessage(null);
    setErrorMessages({
      restartDelayMinutes: parsedRestartDelay.isValid ? null : parsedRestartDelay.errorMessage,
      productDelaySeconds: parsedProductDelay.isValid ? null : parsedProductDelay.errorMessage,
      autoStartDelayMinutes: parsedAutoStartDelay.isValid
        ? null
        : parsedAutoStartDelay.errorMessage,
    });

    if (
      !parsedRestartDelay.isValid ||
      !parsedProductDelay.isValid ||
      !parsedAutoStartDelay.isValid
    ) {
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
        autoStartDelayMinutes: parsedAutoStartDelay.autoStartDelayMinutes,
      });
      setForm((currentForm) => ({ ...currentForm, ...encryptedSecrets }));
      setSecretInputs(initialSecretInputs);
    } catch {
      // IPC 에러 메시지에는 Electron이 채널 정보를 덧붙이므로, 화면에는 정해 둔 메시지를 보여준다.
      setSaveErrorMessage(ERROR_MESSAGE.ENCRYPTION_UNAVAILABLE);

      return;
    }

    // 나머지 설정은 이미 저장했으므로, 시작 프로그램 등록에 실패해도 그 사실만 알린다.
    const [openAtLoginError] = await tryCatch(window.api.setOpenAtLogin(isOpenAtLogin));

    if (openAtLoginError) {
      setSaveErrorMessage(ERROR_MESSAGE.OPEN_AT_LOGIN_FAILED);
    }
  };

  return {
    form,
    secretInputs,
    isOpenAtLogin,
    errorMessages,
    saveErrorMessage,
    changeSettingsForm,
    changeSecretInput,
    changeOpenAtLogin,
    saveSettingsForm,
  };
};

export default useSettingsForm;
