// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

/**
 * Lint-Regeln fuer Engine und App.
 *
 * Zwei Bloecke, weil es zwei Arten Code sind. Die Engine ist dichte
 * Zahlenarbeit ueber typisierten Feldern - dort findet ein typbewusster Linter
 * echte Fehler, und die strengste Voreinstellung ist ihr Geld wert. Die
 * Oberflaeche ist JSX mit Zeigerereignissen; dort zahlt sich `react-hooks` aus
 * und die strengste Stufe vor allem in Laerm.
 *
 * Der wichtigste Teil steht in ENGINE_DOOR: seit die Engine im Projekt liegt,
 * schuetzt keine Paketgrenze mehr ihre oeffentliche Schnittstelle. Diese Regel
 * tut es, und tests/boundary.test.ts tut es ein zweites Mal - beim Linten
 * faellt es sofort auf, im Test faellt es auch dann auf, wenn jemand den Linter
 * umgeht.
 */

/** Die Engine hat genau zwei Tueren. Alles andere ist ihr Innenleben. */
const ENGINE_DOOR = {
  patterns: [
    {
      group: ['@engine/*', '@engine/*/**', '!@engine/i18n'],
      message: 'Die Engine hat zwei Tueren: @engine und @engine/i18n. Was du brauchst, gehoert in src/engine/index.ts exportiert.',
    },
    {
      group: ['**/engine/**', '**/engine'],
      message: 'Die Engine wird ueber @engine angesprochen, nie ueber einen relativen Pfad - sonst findet eine Suche nach @engine nicht alle Nutzer.',
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      'dist/**', 'coverage/**', 'node_modules/**',
      // Liegt in keiner tsconfig, kann also nicht typbewusst geprueft werden.
      'eslint.config.js',
      // Vom Werkzeug geschrieben; der Generator dahinter wird geprueft.
      'src/app/catalog.ts',
    ],
  },

  // ---------- Engine ----------
  {
    files: ['src/engine/**/*.ts', 'tests/engine/**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.engine.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Die Engine ist abhaengigkeitsfrei und plattformneutral; Ausgabe waere
      // eine Nebenwirkung, um die niemand gebeten hat.
      'no-console': 'error',
      'no-restricted-globals': [
        'error',
        { name: 'window', message: 'Die Engine muss plattformneutral bleiben.' },
        { name: 'document', message: 'Die Engine muss plattformneutral bleiben.' },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Der gesaete Rng ist zustaendig - die Ausgabe muss reproduzierbar sein.' },
      ],
      // Die Engine kennt die App nicht, auch nicht ueber ihre eigene Tuer.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@engine', '@engine/**'], message: 'Innerhalb der Engine wird relativ importiert, nicht ueber die eigene Tuer.' },
            { group: ['@app/**', '**/app/**'], message: 'Die Engine darf die Oberflaeche nicht kennen.' },
          ],
        },
      ],

      // Benennung: alles englisch, und die Absicht muss lesbar sein.
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', format: ['camelCase', 'UPPER_CASE'] },
        { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
        { selector: 'objectLiteralProperty', format: null },
        { selector: 'typeProperty', format: ['camelCase'] },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
      ],

      // An einer Modulgrenze ist ausgeschrieben besser als hergeleitet.
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        { considerDefaultExhaustiveForUnions: true },
      ],

      // Zahlencode liest sich mit ausgeschriebener Absicht besser als mit Tricks.
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    // Tests duerfen nach Abkuerzungen greifen, die die Engine selbst nicht darf.
    files: ['tests/engine/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'no-console': 'off',
    },
  },

  // ---------- Oberflaeche, Skripte, App-Tests ----------
  {
    files: ['src/**/*.ts', 'src/**/*.tsx', 'scripts/**/*.ts', 'tests/**/*.ts', '*.config.ts'],
    ignores: ['src/engine/**', 'tests/engine/**'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': ['error', ENGINE_DOOR],
    },
  },
  {
    // Wartungsskripte laufen von Hand am Terminal - dass sie schreiben, was sie
    // getan haben, ist der Zweck und keine verirrte Nebenwirkung.
    files: ['scripts/**/*.ts', 'tests/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
);
