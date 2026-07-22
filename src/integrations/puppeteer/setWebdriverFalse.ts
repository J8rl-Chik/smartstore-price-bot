/*
 * puppeteer가 새 문서에 주입하는 스크립트라 브라우저 컨텍스트에서 실행된다(navigator는 브라우저 전역).
 * 자동화 탐지를 피하려고 navigator.webdriver가 항상 false를 반환하도록 덮어쓴다.
 */
const setWebdriverFalse = (): void => {
  Object.defineProperty(navigator, 'webdriver', { get: () => false });
};

export default setWebdriverFalse;
