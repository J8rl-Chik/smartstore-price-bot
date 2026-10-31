import styled from 'styled-components';
import type { InvalidProductRow } from '../../../domain/product/_type';

interface InvalidProductRowBannerProps {
  // 시트 값이 잘못되어 가격 수정 대상에서 빠진 시트 행
  rows: InvalidProductRow[];
}

const InvalidProductRowBannerContainer = styled.section`
  padding: 12px 16px;
  margin-bottom: 24px;
  font-size: 14px;
  color: ${({ theme }) => theme.color.red600};
  background: ${({ theme }) => theme.color.red50};
  border: 1px solid ${({ theme }) => theme.color.red100};
  border-radius: 10px;
`;

const Title = styled.h2`
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
`;

const ProductName = styled.strong`
  font-weight: 500;
`;

const ErrorMessages = styled.ul`
  padding-left: 16px;
  font-size: 12px;
`;

// 시트에 같은 이름의 행이 여러 개 있으면 이름이 겹치므로, key에 순서를 함께 붙인다.
const InvalidProductRowBanner = ({ rows }: InvalidProductRowBannerProps): React.JSX.Element => (
  <InvalidProductRowBannerContainer>
    <Title>시트 제품 행 변환 오류</Title>
    <ul>
      {rows.map(({ name, errorMessages }, index) => (
        <li key={`${name}-${index}`}>
          <ProductName>{name}</ProductName>
          <ErrorMessages>
            {errorMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ErrorMessages>
        </li>
      ))}
    </ul>
  </InvalidProductRowBannerContainer>
);

export default InvalidProductRowBanner;
