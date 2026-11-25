import { useMemo } from 'react';
import styled, { css } from 'styled-components';
import DeliveryFeeInfo from './DeliveryFeeInfo';
import StatusBadge from './StatusBadge';
import formatTotalPrice from '../domain/formatTotalPrice';
import { parseToProductTableRow } from '../domain/parseToProductTableRow';
import type { TargetProductWithUpdate } from '../../../domain/product/_type';

interface ProductTableRowProps {
  targetProduct: TargetProductWithUpdate;
  // 순회 중 지금 가격을 수정하고 있는 상품인지. 목록에서 위치를 찾기 쉽게 행을 강조한다.
  isUpdating: boolean;
}

const ProductTableRowContainer = styled.tr<{ $isUpdating: boolean }>`
  background: ${({ $isUpdating, theme }) => ($isUpdating ? theme.color.blue50 : 'transparent')};

  &:not(:last-child) td {
    border-bottom: 1px solid ${({ theme }) => theme.color.gray100};
  }
`;

const cell = css`
  padding: 16px;
  font-size: 14px;
  color: ${({ theme }) => theme.color.gray900};
  text-align: left;
`;

const NameCell = styled.td`
  ${cell}
  font-weight: 500;
`;

const ConfiguredPriceCell = styled.td`
  ${cell}
  color: ${({ theme }) => theme.color.gray500};
  text-align: right;
`;

const CurrentPriceCell = styled.td`
  ${cell}
  font-weight: 700;
  text-align: right;
`;

const UpdatedPriceCell = styled.td`
  ${cell}
  font-weight: 700;
  color: ${({ theme }) => theme.color.blue500};
  text-align: right;
`;

const StatusCell = styled.td`
  ${cell}
  text-align: center;
`;

const ErrorMessage = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.color.red500};
`;

const UpdateTimeCell = styled.td`
  ${cell}
  font-size: 13px;
  color: ${({ theme }) => theme.color.gray400};
  text-align: right;
`;

/**
 * 표에 보여줄 값은 행 안에서 변환하고, 상품 참조가 같으면 이전 변환 결과를 다시 쓴다.
 * useTargetProductsUpdate가 내용이 바뀌지 않은 상품의 참조를 유지하므로, 바뀐 상품만 다시 변환한다.
 */
const ProductTableRow = ({
  targetProduct,
  isUpdating,
}: ProductTableRowProps): React.JSX.Element => {
  const product = useMemo(() => parseToProductTableRow(targetProduct), [targetProduct]);

  return (
    <ProductTableRowContainer $isUpdating={isUpdating}>
      <NameCell>{product.name}</NameCell>
      <ConfiguredPriceCell>
        {formatTotalPrice(product.configuredPrice)}
        <DeliveryFeeInfo {...product.configuredPrice} />
      </ConfiguredPriceCell>
      <CurrentPriceCell>
        {formatTotalPrice(product.currentPrice)}
        <DeliveryFeeInfo {...product.currentPrice} />
      </CurrentPriceCell>
      <UpdatedPriceCell>
        {product.updatedPrice === null ? (
          '—'
        ) : (
          <>
            {formatTotalPrice(product.updatedPrice)}
            <DeliveryFeeInfo {...product.updatedPrice} />
          </>
        )}
      </UpdatedPriceCell>
      <StatusCell>
        <StatusBadge status={product.status} />
        {product.errorMessage !== null && <ErrorMessage>{product.errorMessage}</ErrorMessage>}
      </StatusCell>
      <UpdateTimeCell>{product.updateTime}</UpdateTimeCell>
    </ProductTableRowContainer>
  );
};

export default ProductTableRow;
