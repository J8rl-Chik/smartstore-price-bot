import styled from 'styled-components';
import ProductTableRow from './ProductTableRow';
import type { ProductListItem } from './ProductTableRow';

interface ProductTableProps {
  products: ProductListItem[];
}

/**
 * border-collapse는 기본값(separate)을 쓰므로 셀 사이 간격이 생기지 않도록 border-spacing: 0을 준다.
 */
const ProductTableContainer = styled.table`
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

const HeaderCell = styled.th.attrs({ scope: 'col' })<{ $isRight?: boolean }>`
  padding: 16px;
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.color.gray500};
  text-align: ${({ $isRight }) => ($isRight ? 'right' : 'left')};
  border-bottom: 1px solid ${({ theme }) => theme.color.gray200};
`;

const ProductTable = ({ products }: ProductTableProps): React.JSX.Element => (
  <ProductTableContainer>
    <Title>상품 목록</Title>
    <colgroup>
      <Column data-testid="col-name" $width="42%" />
      <Column data-testid="col-set-price" $width="12%" />
      <Column data-testid="col-current-price" $width="12%" />
      <Column data-testid="col-updated-price" $width="12%" />
      <Column data-testid="col-status" $width="10%" />
      <Column data-testid="col-updated-at" $width="12%" />
    </colgroup>
    <thead>
      <tr>
        <HeaderCell>제품명</HeaderCell>
        <HeaderCell $isRight>설정가</HeaderCell>
        <HeaderCell $isRight>현재가</HeaderCell>
        <HeaderCell $isRight>수정가</HeaderCell>
        <HeaderCell>상태</HeaderCell>
        <HeaderCell $isRight>수정 시간</HeaderCell>
      </tr>
    </thead>
    <tbody>
      {products.map((product) => (
        <ProductTableRow key={product.id} product={product} />
      ))}
    </tbody>
  </ProductTableContainer>
);

export default ProductTable;
