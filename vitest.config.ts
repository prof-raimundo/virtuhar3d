import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'rules/src/**/*.test.ts',
      'content/src/**/*.test.ts',
      'server/src/**/*.test.ts',
      'web/src/**/*.test.{ts,tsx}',
      'scripts/**/*.test.ts',
    ],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'rules/src/**/*.ts',
        'content/src/**/*.ts',
        'server/src/**/*.ts',
        'web/src/api/**/*.ts',
        'web/src/audio/**/*.ts',
        'web/src/three/gltfLoader.ts',
        'scripts/validate-assets.ts',
        'scripts/traceability-report.ts',
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        'rules/src/types.ts',
        'server/src/index.ts',
        'server/src/devPreview.ts',
        'server/src/db.ts',
      ],
      thresholds: {
        lines: 80,
        'rules/src/**/*.ts': {
          lines: 90,
        },
        'server/src/**/*.ts': {
          lines: 80,
        },
        'web/src/**/*.ts': {
          lines: 80,
        },
      },
    },
  },
});
