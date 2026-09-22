export default {
  extends: ['stylelint-config-recess-order'],
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      customSyntax: 'postcss-styled-syntax',
    },
  ],
};
