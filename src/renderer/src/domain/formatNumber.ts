// 숫자에 천 단위 구분 기호를 넣는다.
const formatNumber = (value: number): string => value.toLocaleString('ko-KR');

export default formatNumber;
