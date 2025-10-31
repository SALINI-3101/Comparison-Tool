module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    browser: true,
    node: true
  },
  rules: {
    'no-console': 'warn'
  }
};

