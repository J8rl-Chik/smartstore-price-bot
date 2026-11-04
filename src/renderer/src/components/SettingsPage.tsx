import styled from 'styled-components';
import SettingsField, { SettingsInput } from './SettingsField';
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
const TestModeHint = styled.p`
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

const SettingsPage = (): React.JSX.Element => {
  const { form, errorMessages, changeSettingsForm, saveSettingsForm } = useSettingsForm();

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
            <SettingsInput type="password" placeholder="비밀번호 입력" />
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
            <SettingsInput type="password" placeholder="커머스 API Client Secret 입력" />
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
            <SettingsInput type="file" accept=".json" />
          </SettingsField>
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
          <TestModeHint>켜면 실제 가격을 수정하지 않아요.</TestModeHint>
        </SettingsSection>
      </SectionGrid>
      <SaveButton type="button" onClick={saveSettingsForm}>
        저장
      </SaveButton>
    </section>
  );
};

export default SettingsPage;
