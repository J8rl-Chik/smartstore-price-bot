import styled from 'styled-components';

const ProductTableCell = styled.td<{ $isRight?: boolean }>`
  padding: 16px 0;
  text-align: ${({ $isRight }) => ($isRight ? 'right' : 'left')};
`;

export default ProductTableCell;
