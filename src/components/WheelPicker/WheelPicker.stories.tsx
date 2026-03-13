import React, { useMemo, useState } from "react";
import { Meta } from "@storybook/react-native";
import { useSharedValue } from "react-native-reanimated";
import { WheelPicker } from "./WheelPicker";
import { Text, View } from "react-native";
import { Button, ButtonText } from "@/src";
import { usePickerState } from "@/src/components/WheelPicker/WheelPicker.hooks";

const meta: Meta = {
  title: "Components/WheelPicker",
  component: WheelPicker,
};

export default meta;

export const Default = {
  render: () => {
    const value = useSharedValue(25);
    const data = Array.from({ length: 100 }, (_, i) => i);

    return <WheelPicker data={data} label={"kg"} value={value} />;
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
    const data = Array.from({ length: 100 }, (_, i) => i);
    const min = data[0];
    const max = data[data.length - 1];

    return (
      <View>
        <WheelPicker data={data} value={value} />

        <View className={"p-4 gap-2 flex-row"}>
          <Button
            onPress={() => (value.value = Math.max(min, value.value - 10))}
          >
            <ButtonText>-10</ButtonText>
          </Button>
          <Button
            onPress={() => (value.value = Math.min(max, value.value + 10))}
          >
            <ButtonText>+10</ButtonText>
          </Button>
        </View>
      </View>
    );
  },
};

export const StringData = {
  render: () => {
    const data = ["Cat", "Dog", "Fox", "Otter", "Tiger"];
    const value = useSharedValue<(typeof data)[number]>("Fox");

    return <WheelPicker data={data} value={value} />;
  },
};

export const CustomHitbox = {
  render: () => {
    const data = Array.from({ length: 24 }, (_, i) => i);
    const value = useSharedValue(8);

    return (
      <WheelPicker
        data={data}
        label={"h"}
        hitboxHorizontalPadding={40}
        hitboxVerticalPadding={32}
        value={value}
      />
    );
  },
};

export const CustomSizing = {
  render: () => {
    const data = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
    const value = useSharedValue(12);

    const [rerenderTest, setRerenderText] = usePickerState(value);

    return (
      <View className={"w-full items-center"}>
        <Text className={"color-foreground"}>{rerenderTest}</Text>
        <Button onPress={() => setRerenderText((prev) => prev + 3)}>
          <ButtonText>+3</ButtonText>
        </Button>

        <WheelPicker
          data={data}
          label={"min"}
          labelClassName={"text-lg text-foreground"}
          itemHeight={50}
          pickerWidth={30}
          value={value}
        />
      </View>
    );
  },
};
