import styled, { keyframes } from 'styled-components';
import ProductTableRow from './ProductTableRow';
import type { TProductTableRow } from '../domain/_type';

type TextAlign = 'left' | 'center' | 'right';

interface ProductTableProps {
  products: TProductTableRow[];
  // 지금 가격을 수정하고 있는 상품의 id. 순회 중이 아니면 null
  currentProductId: TProductTableRow['id'] | null;
  // 상품 목록을 불러오는 중인지. 불러오는 동안 상품 행 대신 스켈레톤 상자를 보여준다.
  isPreparing: boolean;
}

/**
 * border-collapse는 기본값(separate)을 쓰므로 셀 사이 간격이 생기지 않도록 border-spacing: 0을 준다.
 * 준비 중에는 AppContainer(flex column)의 남은 높이를 채워, 늘어난 높이가 스켈레톤 상자가 있는 tbody로 가게 한다.
 */
const ProductTableContainer = styled.table<{ $isPreparing: boolean }>`
  flex: ${({ $isPreparing }) => ($isPreparing ? 1 : 'none')};
  width: 100%;
  margin-bottom: 24px;
  table-layout: fixed;
  border-spacing: 0;
  background: ${({ theme }) => theme.color.white};
  border-radius: 16px;
`;

const Title = styled.caption`
  padding-bottom: 12px;
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.color.gray900};
  text-align: left;
`;

const Column = styled.col<{ $width?: string }>`
  width: ${({ $width }) => $width};
`;

const HeaderCell = styled.th.attrs({ scope: 'col' })<{ $align?: TextAlign }>`
  padding: 16px;
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.color.gray500};
  text-align: ${({ $align = 'right' }) => $align};
  border-bottom: 1px solid ${({ theme }) => theme.color.gray200};
`;

/**
 * ProgressBar의 shimmer처럼 오른쪽에서 왼쪽으로 지나가게 한다.
 * 이미지(200%)가 상자보다 넓으면 background-position %의 이동 방향이 반대라 시작과 끝을 바꿨다.
 */
const skeletonShimmer = keyframes`
  0% {
    background-position: -50% 0;
  }
  100% {
    background-position: 150% 0;
  }
`;

/**
 * 셀 안 요소의 height: 100%는 늘어난 행 높이를 따르지 않아, 셀 배경에 직접 shimmer를 그린다.
 * background-clip으로 padding 안쪽에만 칠해 표 테두리와 16px 여백을 둔다.
 * height는 셀에서 최소 높이로 동작해, 창이 작아도 240px 상자와 위아래 여백이 보인다.
 */
const SkeletonCell = styled.td`
  height: 272px;
  padding: 16px;
  background: linear-gradient(
    90deg,
    ${({ theme }) => theme.color.gray100} 0%,
    ${({ theme }) => theme.color.gray300} 50%,
    ${({ theme }) => theme.color.gray100} 100%
  );
  background-clip: content-box;
  background-size: 200% 100%;
  /* content-box의 모서리 반경은 border-radius - padding(16px)이라, 안쪽이 12px 둥글게 보이도록 28px를 준다. */
  border-radius: 28px;
  animation: ${skeletonShimmer} 1.5s ease-in-out infinite;
`;

const ProductTable = ({
  products,
  currentProductId,
  isPreparing,
}: ProductTableProps): React.JSX.Element => (
  <ProductTableContainer $isPreparing={isPreparing}>
    <Title>상품 목록</Title>
    <colgroup>
      <Column data-testid="col-name" $width="38%" />
      <Column data-testid="col-set-price" $width="14%" />
      <Column data-testid="col-current-price" $width="14%" />
      <Column data-testid="col-updated-price" $width="14%" />
      <Column data-testid="col-status" $width="10%" />
      <Column data-testid="col-updated-at" $width="10%" />
    </colgroup>
    <thead>
      <tr>
        <HeaderCell $align="left">제품명</HeaderCell>
        <HeaderCell>설정가</HeaderCell>
        <HeaderCell>현재가</HeaderCell>
        <HeaderCell>수정가</HeaderCell>
        <HeaderCell $align="center">상태</HeaderCell>
        <HeaderCell>수정 시간</HeaderCell>
      </tr>
    </thead>
    <tbody>
      {/* 준비가 끝나야 상품 수를 알 수 있어, 행 대신 표 너비를 채우는 상자 하나를 보여준다. */}
      {isPreparing ? (
        <tr>
          <SkeletonCell colSpan={6} role="status" aria-label="상품 목록을 불러오는 중" />
        </tr>
      ) : (
        products.map((product) => (
          <ProductTableRow
            key={product.id}
            product={product}
            isUpdating={product.id === currentProductId}
          />
        ))
      )}
    </tbody>
  </ProductTableContainer>
);

export default ProductTable;
