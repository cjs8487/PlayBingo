import type { Config } from 'jest';

const config: Config = {
    testMatch: ['**/*.test.ts'],
    collectCoverage: true,
    transform: {
        '.[jt]sx?$': 'babel-jest',
    },
};

export default config;
