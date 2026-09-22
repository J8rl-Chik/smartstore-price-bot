import React from 'react';
import { render, type RenderOptions, type RenderResult } from 'vitest-browser-react';
import StyleProvider from './components/StyleProvider';

/* eslint-disable react-refresh/only-export-components */

const AllTheProviders = ({ children }: { children: React.ReactNode }): React.JSX.Element => (
  <StyleProvider>{children}</StyleProvider>
);

export const customRender = (
  ui: React.ReactNode,
  options?: RenderOptions,
): Promise<RenderResult> => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};
