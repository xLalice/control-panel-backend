/// <reference types="vitest/globals" />

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTransformMode: {
        // Specify a glob pattern for the files that should be transformed
        web: ['**/*.ts', '**/*.tsx'], // Glob pattern for transforming TS/TSX files
      },
  },
});
