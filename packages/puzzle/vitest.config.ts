import { defineConfig } from 'vitest/config';

/**
 * Two tiers of tests.
 *
 * `unit` stays under a minute so it actually gets run while working: examples
 * plus property tests on small grids. `deep` adds hundreds of seeds across
 * every size, reference-solver cross-checks and timing budgets — the run that
 * proves the generator, but too slow to sit in the edit loop.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/deep/**'],
          testTimeout: 60_000,
        },
      },
      {
        test: {
          name: 'deep',
          environment: 'node',
          include: ['tests/deep/**/*.test.ts'],
          testTimeout: 600_000,
        },
      },
    ],
  },
});
