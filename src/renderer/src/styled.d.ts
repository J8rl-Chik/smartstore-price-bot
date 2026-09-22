import 'styled-components';
import THEME from './assets/theme';

type Theme = typeof THEME;

declare module 'styled-components' {
  export interface DefaultTheme extends Theme {}
}
