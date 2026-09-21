import { useState } from 'react';
import styled from 'styled-components';
import { THEME } from '../theme';

const { color } = THEME;

const PRODUCTS = [
  {
    id: 1,
    name: '무선 블루투스 이어폰 Pro',
    price: 320022220,
    category: '전자기기',
    status: '대기',
    date: '2026.03.10',
    checked: false,
  },
  {
    id: 2,
    name: '스테인리스 텀블러 500ml',
    price: 18500,
    category: '생활용품',
    status: '대기',
    date: '2026.03.09',
    checked: false,
  },
  {
    id: 3,
    name: '오가닉 코튼 베이직 티셔츠',
    price: 29000,
    category: '의류',
    status: '완료',
    date: '2026.03.09',
    checked: false,
  },
  {
    id: 4,
    name: 'LED 눈보호 데스크 램프',
    price: 45000,
    category: '인테리어',
    status: '대기',
    date: '2026.03.08',
    checked: false,
  },
  {
    id: 5,
    name: '프리미엄 무독성 요가 매트',
    price: 38000,
    category: '스포츠',
    status: '오류',
    date: '2026.03.08',
    checked: false,
  },
  {
    id: 6,
    name: '초고속 보조배터리 20000mAh',
    price: 25000,
    category: '전자기기',
    status: '대기',
    date: '2026.03.07',
    checked: false,
  },
];
const PageWrap = styled.div`
  flex: 1;
  padding: 32px;
  min-height: 100vh;
  background: ${color.gray50};
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: ${color.gray900};
  margin: 0;
`;

const PrimaryBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${color.blue500};
  color: ${color.white};
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${color.blue600};
  }
`;

const StatGrid = styled.div<{ cols?: number }>`
  /* display: grid; */
  /* grid-template-columns: repeat(${({ cols }) => cols ?? 3}, 1fr); */
  width: 600px;
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
`;

const Card = styled.div`
  /* flex: 0 0 33%; */
  white-space: nowrap;
  flex: 1;
  /* flex-basis: 0%; */
  background: ${color.white};
  border-radius: 12px;
  border: 1px solid ${color.gray100};
`;

const StatCard = styled(Card)`
  padding: 20px;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: ${color.gray500};
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: ${color.gray900};
  margin-bottom: 4px;
`;

const StatSub = styled.div`
  font-size: 12px;
  color: ${color.gray400};
`;

const ProductListScreen = ({ onStart }: { onStart: () => void }): React.JSX.Element => {
  const [products, setProducts] = useState(PRODUCTS);
  const allChecked = products.every((p) => p.checked);

  const toggleAll = (): void => setProducts(products.map((p) => ({ ...p, checked: !allChecked })));
  const toggleOne = (id: number): void =>
    setProducts(products.map((p) => (p.id === id ? { ...p, checked: !p.checked } : p)));

  return (
    <PageWrap>
      <PageHeader>
        <PageTitle>스마트 스토어 최저가 봇</PageTitle>
        <PrimaryBtn>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="white" strokeWidth="1.2" />
            <path d="M5 7h4M7 5v4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          자동 수정 시작
        </PrimaryBtn>
      </PageHeader>

      <StatGrid>
        {[
          { label: '총 제품 수', value: '128sss개', sub: '등록된 활성 상품 기준' },
          { label: '수정 대기', value: '45개', sub: '대기중인 자동 보정 대상' },
          { label: '최근 수정', value: '3시간 전', sub: '자동 최적화 완료 시간' },
        ].map((s) => (
          <StatCard key={s.label}>
            <StatLabel>{s.label}</StatLabel>
            <StatValue>{s.value}</StatValue>
            <StatSub>{s.sub}</StatSub>
          </StatCard>
        ))}
      </StatGrid>

      {/* <TableCard>
        <TableHeader>
          <TableTitle>최근 유입된 제품 목록</TableTitle>
        </TableHeader>
        <Table>
          <Thead>
            <tr>
              <Th style={{ width: 40 }}>
                <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              </Th>
              <Th>상품명</Th>
              <Th>가격</Th>
              <Th>카테고리</Th>
              <Th>상태</Th>
              <Th>최종 수정일</Th>
            </tr>
          </Thead>
          <tbody>
            {products.map((p) => (
              <Tr key={p.id} $checked={p.checked} onClick={() => toggleOne(p.id)}>
                <CheckboxCell>
                  <input
                    type="checkbox"
                    checked={p.checked}
                    onChange={() => toggleOne(p.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </CheckboxCell>
                <Td>{p.name}</Td>
                <Td>₩{p.price.toLocaleString()}</Td>
                <Td style={{ color: color.gray600 }}>{p.category}</Td>
                <Td>
                  <StatusBadge status={p.status} />
                </Td>
                <Td style={{ color: color.gray400 }}>{p.date}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </TableCard> */}
    </PageWrap>
  );
};

export default ProductListScreen;
