module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 57) automatically appends react-native-worklets/plugin
    // when the package is installed, which is required by react-native-reanimated 4.
    // Do NOT add the worklets/reanimated plugin here as well, or it double-applies.
    presets: ['babel-preset-expo'],
  };
};
