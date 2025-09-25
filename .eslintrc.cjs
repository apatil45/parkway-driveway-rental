module.exports = {
  env: {
    node: true,
    commonjs: true,
    es2021: true,
  },
  extends: ['eslint:recommended', 'prettier', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^',
        varsIgnorePattern: '^',
        caughtErrorsIgnorePattern: '^',
      },
    ],
    'no-console': 'off',
  },
};
