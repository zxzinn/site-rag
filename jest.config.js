export default {
  preset: "ts-jest/presets/default-esm",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^strip-ansi$": "<rootDir>/node_modules/strip-ansi/index.js",
  },
  transformIgnorePatterns: ["node_modules/(?!(strip-ansi|string-width)/.*)"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  testEnvironment: "node",
  setupFiles: ["dotenv/config"],
  passWithNoTests: true,
  testTimeout: 20_000,
};
