import type { ChangeEvent } from 'react';
import styled from 'styled-components';
import SettingsField from './SettingsField';
import SettingsInput from './SettingsInput';
import SettingsNumberInput from './SettingsNumberInput';
import SettingsSection from './SettingsSection';
import SettingsToggle from './SettingsToggle';
import { MIN_PRODUCT_DELAY_SECONDS } from '../domain/parseProductDelay';
import { MIN_RESTART_DELAY_MINUTES } from '../domain/parseRestartDelay';
import useSettingsForm from '../hooks/useSettingsForm';

const Title = styled.h2`
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.gray900};
`;

// 1fr만 쓰면 열이 내용물보다 작아지지 않아 너비가 달라질 수 있으므로, 최소 너비를 0으로 두어 두 열을 같은 너비로 맞춘다.
const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
`;

// SettingsField의 라벨 너비와 간격만큼 들여 입력 요소와 왼쪽을 맞춘다.
const FieldHint = styled.p`
  margin: 8px 0 0 144px;
  font-size: 12px;
  color: ${({ theme }) => theme.color.gray500};
`;

const SaveButton = styled.button`
  display: block;
  width: 100px;
  height: 48px;
  margin: 24px 0 0 auto;
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.white};
  cursor: pointer;
  background: ${({ theme }) => theme.color.blue500};
  border: none;
  border-radius: 14px;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.color.blue600};
  }
`;

const SaveErrorMessage = styled.p`
  margin: 12px 0 0;
  font-size: 12px;
  color: ${({ theme }) => theme.color.red600};
  text-align: right;
`;

const savedSecretPlaceholder = '저장됨 (바꾸려면 새로 입력)';

// 저장한 비밀값은 화면으로 돌려받지 않으므로, 입력칸을 비워 두고 저장 여부만 안내한다.
const createSecretPlaceholder = (encryptedSecret: string, placeholder: string): string =>
  encryptedSecret === '' ? placeholder : savedSecretPlaceholder;

const SettingsPage = (): React.JSX.Element => {
  const {
    form,
    secretInputs,
    errorMessages,
    saveErrorMessage,
    changeSettingsForm,
    changeSecretInput,
    saveSettingsForm,
  } = useSettingsForm();

  // 파일 선택을 취소하면 빈 값이 되어 저장해 둔 암호문을 유지한다.
  const changeServiceAccountKey = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const serviceAccountKeyFile = event.target.files?.[0];
    const serviceAccountKey = serviceAccountKeyFile ? await serviceAccountKeyFile.text() : '';

    changeSecretInput('serviceAccountKey', serviceAccountKey);
  };

  return (
    <section>
      <Title>사용자 설정</Title>
      <SectionGrid>
        <SettingsSection title="네이버 계정" description="네이버에 로그인할 때 사용해요.">
          <SettingsField label="네이버 아이디">
            <SettingsInput
              type="text"
              placeholder="아이디 입력"
              value={form.naverId}
              onChange={(event) => changeSettingsForm('naverId', event.target.value)}
            />
          </SettingsField>
          <SettingsField label="네이버 비밀번호">
            <SettingsInput
              type="password"
              placeholder={createSecretPlaceholder(form.encryptedNaverPassword, '비밀번호 입력')}
              value={secretInputs.naverPassword}
              onChange={(event) => changeSecretInput('naverPassword', event.target.value)}
            />
          </SettingsField>
        </SettingsSection>
        <SettingsSection
          title="스토어 · 커머스 API"
          description="내 스토어와 커머스 API 연동 정보예요."
        >
          <SettingsField label="내 스토어 이름">
            <SettingsInput
              type="text"
              placeholder="스토어 이름 입력"
              value={form.storeName}
              onChange={(event) => changeSettingsForm('storeName', event.target.value)}
            />
          </SettingsField>
          <SettingsField label="Client ID">
            <SettingsInput
              type="text"
              placeholder="커머스 API Client ID 입력"
              value={form.clientId}
              onChange={(event) => changeSettingsForm('clientId', event.target.value)}
            />
          </SettingsField>
          <SettingsField label="Client Secret">
            <SettingsInput
              type="password"
              placeholder={createSecretPlaceholder(
                form.encryptedClientSecret,
                '커머스 API Client Secret 입력',
              )}
              value={secretInputs.clientSecret}
              onChange={(event) => changeSecretInput('clientSecret', event.target.value)}
            />
          </SettingsField>
        </SettingsSection>
        <SettingsSection title="구글 시트" description="상품 목록을 읽어올 시트예요.">
          <SettingsField label="구글 시트 ID">
            <SettingsInput
              type="text"
              placeholder="시트 ID 입력"
              value={form.sheetId}
              onChange={(event) => changeSettingsForm('sheetId', event.target.value)}
            />
          </SettingsField>
          <SettingsField label="시트 이름">
            <SettingsInput
              type="text"
              placeholder="시트 이름 입력"
              value={form.sheetName}
              onChange={(event) => changeSettingsForm('sheetName', event.target.value)}
            />
          </SettingsField>
          <SettingsField label="서비스 계정 키">
            {/* 저장하면 암호문이 바뀌어 새로 마운트되므로, 선택한 파일 이름이 입력칸에 남지 않는다. */}
            <SettingsInput
              key={form.encryptedServiceAccountKey}
              type="file"
              accept=".json"
              onChange={(event) => void changeServiceAccountKey(event)}
            />
          </SettingsField>
          {form.encryptedServiceAccountKey !== '' && (
            <FieldHint>저장됨 (바꾸려면 새 파일 선택)</FieldHint>
          )}
        </SettingsSection>
        <SettingsSection title="실행" description="봇이 상품을 확인하는 방식을 정해요.">
          <SettingsField label="순회 간격" errorMessage={errorMessages.restartDelayMinutes}>
            <SettingsNumberInput
              unit="분"
              min={MIN_RESTART_DELAY_MINUTES}
              step={1}
              placeholder="비우면 한 번만"
              value={form.restartDelayMinutes}
              onChange={(event) => changeSettingsForm('restartDelayMinutes', event.target.value)}
            />
          </SettingsField>
          <SettingsField label="상품 간 대기 시간" errorMessage={errorMessages.productDelaySeconds}>
            <SettingsNumberInput
              unit="초"
              min={MIN_PRODUCT_DELAY_SECONDS}
              step={1}
              value={form.productDelaySeconds}
              onChange={(event) => changeSettingsForm('productDelaySeconds', event.target.value)}
            />
          </SettingsField>
          <SettingsField label="테스트 모드">
            <SettingsToggle
              isChecked={form.isDryRun}
              onChange={(event) => changeSettingsForm('isDryRun', event.target.checked)}
            />
          </SettingsField>
          <FieldHint>켜면 실제 가격을 수정하지 않아요.</FieldHint>
        </SettingsSection>
      </SectionGrid>
      {saveErrorMessage && <SaveErrorMessage>{saveErrorMessage}</SaveErrorMessage>}
      <SaveButton type="button" onClick={() => void saveSettingsForm()}>
        저장
      </SaveButton>
    </section>
  );
};

export default SettingsPage;
