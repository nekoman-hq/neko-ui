import React from "react";
import { Button, ButtonText } from "./Button";
import { Alert, Text, View } from "react-native";
import { Meta, StoryObj } from "@storybook/react-native";

const meta: Meta = {
  title: "Components/Button",
  component: Button,
  decorators: [
    (Story: React.FC) => {
      return (
        <View className={"flex w-full flex-col items-start p-4"}>
          <Story />
        </View>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Button {...args}>
      <ButtonText>Ping</ButtonText>
    </Button>
  ),
  args: {
    onPress: () => Alert.alert("Pong"),
  },
};

export const Disabled: Story = {
  render: (args) => (
    <Button {...args}>
      <ButtonText>Disabled</ButtonText>
    </Button>
  ),
  args: {
    disabled: true,
  },
};
