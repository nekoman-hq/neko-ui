import React, { useState } from "react";
import { Meta, StoryObj } from "@storybook/react-native";
import { ProgressBar, ProgressBarThemeProvider } from "./ProgressBar";
import { Text, View } from "react-native";
import { Button, ButtonText } from "../Button";

const meta: Meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  decorators: [
    (Story, context) => {
      if (!context.args.withTheme)
        return (
          <Story
            args={{
              ...context.args,
            }}
          />
        );

      return (
        <ProgressBarThemeProvider
          theme={{
            progressActive: "#f00",
          }}
        >
          <Story />
        </ProgressBarThemeProvider>
      );
    },

    (Story, context) => {
      const [value, setValue] = useState(10);

      return (
        <View className={"items-start gap-10"}>
          <Story
            args={{
              ...context.args,
              value,
            }}
          />

          <View className={"gap-2"}>
            <Text className={"text-foreground text-lg"}>Value: {value}</Text>
            {context.args.maxValue && (
              <Text className={"text-foreground text-lg"}>
                Max Value: {context.args.maxValue}
              </Text>
            )}

            <View className={"flex flex-row gap-2"}>
              <Button onPress={() => setValue((prev) => prev - 10)}>
                <ButtonText>-10</ButtonText>
              </Button>
              <Button onPress={() => setValue((prev) => prev + 10)}>
                <ButtonText>+10</ButtonText>
              </Button>
            </View>
          </View>
        </View>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default = {};

export const WithMaxValue: Story = {
  args: {
    maxValue: 200,
  },
};

export const WithDashes: Story = {
  args: {
    dashes: 10,
    dashGap: 4,
    maxValue: 200,
  },
};

export const WithThemeProvider: Story = {
  args: {
    withTheme: true,
    dashes: 6,
  },
};

export const WithGradient: Story = {
  args: {
    colors: ["#f00", "#ff0", "#0018ff"],
    dashes: 9,
    className: "h-2",
    backgroundClassName: "h-2",
  },
};
