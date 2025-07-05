module.exports = {
  arrowParens: 'avoid',
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  tabWidth: 2,
  useTabs: false,
  printWidth: 100,
  bracketSpacing: true,
  jsxBracketSameLine: false,
  endOfLine: 'auto',
  proseWrap: 'preserve',
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
  ],
};
