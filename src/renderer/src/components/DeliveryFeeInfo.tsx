import styled from 'styled-components';

interface DeliveryFeeInfoProps {
  // 배송비를 포함한 합계 금액
  price: number;
  deliveryFee: number;
}

const DeliveryFeeInfoContainer = styled.div`
  margin-top: 4px;
  font-size: 12px;
  font-weight: 400;
  color: ${({ theme }) => theme.color.gray500};
`;

const FreeDeliveryBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  background: ${({ theme }) => theme.color.gray100};
  border-radius: 4px;
`;

const formatNumber = (value: number): string => value.toLocaleString('ko-KR');

const DeliveryFeeInfo = ({ price, deliveryFee }: DeliveryFeeInfoProps): React.JSX.Element => (
  <DeliveryFeeInfoContainer>
    {deliveryFee === 0 ? (
      <FreeDeliveryBadge>무료배송</FreeDeliveryBadge>
    ) : (
      `제품 ${formatNumber(price - deliveryFee)} + 배송 ${formatNumber(deliveryFee)}`
    )}
  </DeliveryFeeInfoContainer>
);

export default DeliveryFeeInfo;
