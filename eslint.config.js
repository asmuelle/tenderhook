import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'packages/db/drizzle/**',
      '**/next-env.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // AGENTS.md package boundary: packages/core does no I/O — no fs, no
    // network, no env reads. Enforced mechanically, not just in review.
    files: ['packages/core/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['node:*', 'fs', 'http', 'https', 'child_process', 'net'],
              message: 'packages/core is pure domain logic: no I/O imports.',
            },
            {
              group: ['drizzle-orm', 'drizzle-orm/*'],
              message: 'packages/db is the only package that touches Drizzle.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'process', message: 'packages/core reads no env vars.' },
        { name: 'fetch', message: 'packages/core performs no network I/O.' },
      ],
    },
  },
  prettier,
);
