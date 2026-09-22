import { createGlobalStyle, ThemeProvider } from 'styled-components';
import THEME from '../assets/theme';

const Style = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
  }

  html,
  body,
  #root {
    height: 100%;
  }

  body {
    font-family: ${({ theme }) => theme.font.kr};
    color: ${({ theme }) => theme.color.gray900};
  }

  ul,
  ol {
    list-style: none;
  }

  button {
    font-family: inherit;
  }
`;

const StyleProvider = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
  <ThemeProvider theme={THEME}>
    <Style />
    {children}
  </ThemeProvider>
);

export default StyleProvider;
