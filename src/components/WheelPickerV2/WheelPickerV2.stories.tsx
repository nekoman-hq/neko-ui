import React from "react";
import { Meta } from "@storybook/react-native";
import { useSharedValue } from "react-native-reanimated";
import { WheelPickerV2 } from "./WheelPickerV2";
import { View } from "react-native";
import { Button, ButtonText } from "@/src";

const meta: Meta = {
  title: "Components/WheelPickerV2",
  component: WheelPickerV2,
};

export default meta;

export const Default = {
  render: () => {
    const value = useSharedValue(25);

    return <WheelPickerV2 value={value} />;
  },
};

export const ChangeValue = {
  render: () => {
    const value = useSharedValue(25);

    return (
      <View>
        <WheelPickerV2 value={value} />

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
