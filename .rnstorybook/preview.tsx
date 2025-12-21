import type { Preview } from "@storybook/react-native";
import { NavigationContainer } from "@react-navigation/native";
import { View } from "react-native";

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
      // @ts-ignore
      <View className={"bg-background w-full h-full"}>
        <Story />
      </View>
    ),
  ],
};

export default preview;
