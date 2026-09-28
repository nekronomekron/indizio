// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';

/**
 * Lint rules for engine, app, scripts and tests.
 *
 * One strictness for all code (PLAN.md §14, U6): the type-aware strict and
 * stylistic presets everywhere, React and accessibility rules for the UI.
 * Formatting is Prettier's job; `eslint-config-prettier` switches off every
 * rule that would argue with it.
 *
 * Two boundaries are enforced here and a second time in tests — in the linter
 * they show up while typing, in the tests even when someone skips the linter:
 * - the engine has exactly two doors, `@engine` and `@engine/i18n`
 *   (tests/boundary.test.ts);
 * - an app feature may use `shared/`, never another feature.
 */

/** The engine has exactly two doors. Everything else is its own business. */
const ENGINE_DOOR = [
  {
    group: ['@engine/*', '@engine/*/**', '!@engine/i18n'],
    message:
      'The engine has two doors: @engine and @engine/i18n. Export what you need from src/engine/index.ts.',
  },
  {
    group: ['**/engine/**', '**/engine'],
    message:
      'Reach the engine through @engine, never by a relative path — otherwise a search for @engine misses users.',
  },
];

/** Names: English, and the intent readable. Components are PascalCase. */
const NAMING = [
  'error',
  { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
  { selector: 'variable', format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
  { selector: 'function', format: ['camelCase', 'PascalCase'] },
  { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
  { selector: 'typeLike', format: ['PascalCase'] },
  { selector: 'enumMember', format: ['UPPER_CASE'] },
  { selector: 'objectLiteralProperty', format: null },
  { selector: 'typeProperty', format: null },
  { selector: 'import', format: null },
];

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'eslint.config.js'],
  },

  // ---------- Everything typed ----------
  {
    files: [
      'src/**/*.ts',
      'src/**/*.tsx',
      'scripts/**/*.ts',
      'scripts/**/*.tsx',
      'tests/**/*.ts',
      '*.config.ts',
    ],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.engine.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/naming-convention': NAMING,
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      // `onClick={() => setOpen(true)}` is the idiom; a block around it adds
      // braces, not clarity.
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      // Numbers into strings are fine, in `+` as in template literals.
      '@typescript-eslint/restrict-plus-operands': ['error', { allowNumberAndString: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Indexing typed arrays by cell is the bread and butter of this code;
      // `!` after a bounds-checked lookup says more than a dead branch would.
      '@typescript-eslint/no-non-null-assertion': 'off',
      'no-restricted-imports': ['error', { patterns: ENGINE_DOOR }],
    },
  },

  // ---------- Engine ----------
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      // Dependency-free and platform-neutral: output would be a side effect
      // nobody asked for, and a DOM global would break the worker.
      'no-console': 'error',
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'The engine must stay platform-neutral.' },
        { name: 'document', message: 'The engine must stay platform-neutral.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use the seeded Rng — output must be reproducible.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@engine', '@engine/**'],
              message: 'Inside the engine, import relatively, not through its own door.',
            },
            { group: ['@app/**', '**/app/**'], message: 'The engine must not know the UI.' },
          ],
        },
      ],
    },
  },

  // ---------- App ----------
  {
    files: ['src/app/**/*.ts', 'src/app/**/*.tsx', 'src/main.tsx', 'src/worker/**/*.ts'],
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // Types do this job.
      'react/prop-types': 'off',
      'no-console': ['error', { allow: ['error', 'warn'] }],
    },
  },

  // ---------- Engine tests ----------
  {
    // They test the engine's insides on purpose — the door is for users.
    files: ['tests/engine/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },

  // ---------- Scripts and tests ----------
  {
    // Maintenance scripts run by hand in a terminal: printing what they did is
    // the point. Tests may reach for shortcuts the code itself may not.
    files: ['scripts/**/*.ts', 'scripts/**/*.tsx', 'tests/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },

  prettier,
);
