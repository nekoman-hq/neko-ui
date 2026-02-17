// metro.config.js

const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

let defaultConfig = getDefaultConfig(__dirname);

const { withNativeWind } = require("nativewind/metro");
defaultConfig = withNativeWind(defaultConfig, { input: "./global.css" });

const {
  withStorybook,
} = require("@storybook/react-native/metro/withStorybook");
/** withStorybook Adds the config that storybook uses */

const { transformer, resolver } = defaultConfig;

// 1. Point to our custom transformer
defaultConfig.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve(
    path.join(__dirname, "metro.transformer.js"),
  ),
};

// 2. Tell Metro to treat .md as a source file
defaultConfig.resolver = {
  ...resolver,
  // Ensure Metro doesn't try to handle .md as a static asset
  assetExts: resolver.assetExts.filter((ext) => ext !== "md"),
  // Add .md to the list of source file extensions
  sourceExts: [...resolver.sourceExts, "md"],
};

module.exports = withStorybook(defaultConfig);
