const upstreamTransformer = require("@expo/metro-config/babel-transformer");
const svgTransformer = require("react-native-svg-transformer/expo");

module.exports.transform = async function ({ src, filename, ...rest }) {
  // If it's a markdown file, export its content as a string
  if (filename.endsWith(".md")) {
    const code = `module.exports = ${JSON.stringify(src)};`;
    // Pass the new JavaScript code through Expo's default transformer
    return upstreamTransformer.transform({ src: code, filename, ...rest });
  }

  // Handle SVG files (optional, but a common use case)
  if (filename.endsWith(".svg")) {
    return svgTransformer.transform({ src, filename, ...rest });
  }

  // For all other files, use the default behavior
  return upstreamTransformer.transform({ src, filename, ...rest });
};
