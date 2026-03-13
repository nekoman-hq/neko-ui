import React, { useMemo } from "react";
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
    const initialValue = 25;
    const value = useSharedValue(initialValue);
    const data = Array.from({ length: 100 }, (_, i) => i);

    return (
      <WheelPicker
        data={data}
        initialValue={initialValue}
        label={"kg"}
        value={value}
      />
    );
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
    const initialValue = 25;
    const value = useSharedValue(initialValue);
    const data = Array.from({ length: 100 }, (_, i) => i);
    const min = data[0];
    const max = data[data.length - 1];

    return (
      <View>
        <WheelPicker data={data} initialValue={initialValue} value={value} />

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
    const initialValue = "Fox" as (typeof data)[number];
    const value = useSharedValue<(typeof data)[number]>(initialValue);

    return <WheelPicker data={data} initialValue={initialValue} value={value} />;
  },
};

export const CustomHitbox = {
  render: () => {
    const data = Array.from({ length: 24 }, (_, i) => i);
    const initialValue = 8;
    const value = useSharedValue(initialValue);

    return (
      <WheelPicker
        data={data}
        initialValue={initialValue}
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
    const initialValue = 12;
    const value = useSharedValue(initialValue);

    const [rerenderTest, setRerenderText] = usePickerState(value, initialValue);

    return (
      <View className={"w-full items-center"}>
        <Text className={"color-foreground"}>{rerenderTest}</Text>
        <Button onPress={() => setRerenderText((prev) => prev + 3)}>
          <ButtonText>+3</ButtonText>
        </Button>

        <WheelPicker
          data={data}
          initialValue={initialValue}
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
