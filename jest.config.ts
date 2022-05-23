import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
    verbose: true,
    roots: [
        "<rootDir>/src"
    ],
    transform: {
        "^.+\\.[t|j]sx?$": "babel-jest"
    }
};

export default config;