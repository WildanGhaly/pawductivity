/**
 * Jest config for pure-logic unit tests (reward math, brain-dump parser, dates, mood).
 * Uses the jest-expo preset so TypeScript + the Expo/RN module graph transform correctly.
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg))',
  ],
};
