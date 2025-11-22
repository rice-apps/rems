module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.json',
        }],
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@fugood|hnsw-lite)/)',
    ],
};
