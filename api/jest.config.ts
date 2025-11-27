import type { Config } from 'jest';

const config: Config = {
    testMatch: ['**/*.test.ts'],
    collectCoverage: true,
    transform: {
        '.[jt]sx?$': 'babel-jest',
    },
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    clearMocks: true,
};

export default config;
