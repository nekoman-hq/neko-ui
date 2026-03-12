import React from "react";
import { Meta } from "@storybook/react-native";
import { useSharedValue } from "react-native-reanimated";
import { WheelPicker } from "./WheelPicker";
import { View } from "react-native";
import { Button, ButtonText } from "@/src";

const meta: Meta = {
  title: "Components/WheelPicker",
  component: WheelPicker,
};

export default meta;

export const Default = {
  render: () => {
    const value = useSharedValue(25);

    return <WheelPicker value={value} />;
  },
};

export const ChangeValue = {
  parameters: {
    docs: {
      description: {
        story:
          "Committed value changes trigger selection haptics. The initial render does not.",
      },
    },
  },
  render: () => {
    const value = useSharedValue(25);

    return (
      <View>
        <WheelPicker value={value} />

        <View className={"p-4 gap-2 flex-row"}>
          <Button onPress={() => (value.value -= 100)}>
            <ButtonText>-100</ButtonText>
          </Button>
          <Button onPress={() => (value.value += 100)}>
            <ButtonText>+100</ButtonText>
          </Button>
        </View>
      </View>
    );
  },
};
