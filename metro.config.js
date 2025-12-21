// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const { withNativeWind } = require('nativewind/metro');
const tailwindConfig = withNativeWind(config, { input: './global.css' })


const {withStorybook} = require("@storybook/react-native/metro/withStorybook");
/** withStorybook Adds the config that storybook uses */
module.exports = withStorybook(tailwindConfig);