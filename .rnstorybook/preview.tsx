import type { Preview } from "@storybook/react-native";
import { View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { spyOn } from "storybook/test";

export const beforeEach = () => {
  spyOn(console, "log").mockName("console.log");
  spyOn(console, "warn").mockName("console.warn");
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <KeyboardProvider>
        {/* @ts-ignore */}
        <View className={"bg-background w-full h-full"}>
          <Story />
        </View>
      </KeyboardProvider>
    ),
  ],
};

export default preview;
