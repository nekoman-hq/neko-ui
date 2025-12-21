// .rnstorybook/main.ts
import { StorybookConfig } from "@storybook/react-native";

const main: StorybookConfig = {
  stories: [
    "./stories/**/*.stories.?(ts|tsx|js|jsx)",
    // the paths are relative to the main.ts file itself
    "../src/components/**/*.stories.?(ts|tsx|js|jsx)",
  ],
  addons: [
    "@storybook/addon-ondevice-controls",
    "@storybook/addon-ondevice-actions",
    "@storybook/addon-docs",
  ],
};

export default main;
