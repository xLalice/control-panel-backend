"use strict";
/// <reference types="vitest/globals" />
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("vitest/config");
exports.default = (0, config_1.defineConfig)({
    test: {
        environment: 'node',
        globals: true,
        testTransformMode: {
            // Specify a glob pattern for the files that should be transformed
            web: ['**/*.ts', '**/*.tsx'], // Glob pattern for transforming TS/TSX files
        },
    },
});
