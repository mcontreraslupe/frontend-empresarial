import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import playwrightPlugin from 'eslint-plugin-playwright';

export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'executive-report/**',
      'test-results/**',
      'blob-report/**',
      'environments/**',
    ],
  },
  {
    files: ['src/**/*.ts', 'tests/**/*.ts', 'playwright.config.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      playwright: playwrightPlugin,
    },
    rules: {
      ...(playwrightPlugin.configs?.['flat/recommended']?.rules ?? {}),
      'playwright/no-wait-for-timeout': 'error',
      'playwright/expect-expect': [
        'warn',
        {
          assertFunctionNames: ['assertIsLoaded', 'assertAllModulesAreVisible'],
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
