module.exports = {
  extends: 'erb',
  rules: {
    // A temporary hack related to IDE not resolving correct package.json
    'import/no-extraneous-dependencies': 'off',
    'import/no-unresolved': 'error',
    // Since React 17 and typescript 4.1 you can safely disable the rule
    'react/react-in-jsx-scope': 'off',
    'max-classes-per-file': 'off',
    'consistent-return': 'off',
    'import/prefer-default-export': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    'no-plusplus': 'off',
    'no-underscore-dangle': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': 'off',
    'class-methods-use-this': 'off',
    'react/prop-types': 'off',
    'react/require-default-props': 'off',
    'react/jsx-props-no-spreading': 'off',
    // '@typescript-eslint/naming-convention': [
    //   'error',
    //   {
    //     format: [
    //       'camelCase',
    //       'strictCamelCase',
    //       'PascalCase',
    //       'StrictPascalCase',
    //       'snake_case',
    //       'UPPER_CASE',
    //     ],
    //     selector: 'default',
    //     leadingUnderscore: 'allow',
    //     trailingUnderscore: 'allow',
    //   }
    // ],
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/alt-text': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'react/no-unescaped-entities': 'off',
    'promise/always-return': 'off',
    'promise/catch-or-return': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',
    'react-hooks/exhaustive-deps': 'off',
    '@typescript-eslint/naming-convention': 'off',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    createDefaultProgram: true,
  },
  settings: {
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {},
      webpack: {
        config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
      },
      typescript: {},
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
  },
};
