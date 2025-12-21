import React, { useState } from "react";
import { WheelPicker } from "./WheelPicker";
import { Meta } from "@storybook/react-native";
import { Text, View } from "react-native";
import {
  Button,
  ButtonText,
  Segment,
  SegmentedControl,
  ThemeProvider,
} from "@/src";

const meta: Meta = {
  title: "Components/WheelPicker",
  component: WheelPicker,
  args: {},
};

export default meta;

export const Default = {
  render: () => {
    const [index, setIndex] = useState(25);

    return (
      <View className={"p-4 py-10 gap-4"}>
        <WheelPicker
          data={Array.from({ length: 200 }).map((_, i) => i)}
          onChange={(_, index) => setIndex(index)}
          index={index}
        />

        <Text className={"text-foreground"}>Index: {index}</Text>

        <View className={"flex flex-row gap-4"}>
          <Button onPress={() => setIndex((prev) => prev - 10)}>
            <ButtonText>-10</ButtonText>
          </Button>

          <Button onPress={() => setIndex((prev) => prev + 10)}>
            <ButtonText>+10</ButtonText>
          </Button>
        </View>
      </View>
    );
  },
};

export const WithText = {
  render: () => {
    const data = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const [value, setValue] = useState("A");

    return (
      <View className={"gap-4 p-4"}>
        <WheelPicker
          index={data.indexOf(value)}
          onChange={(label, index) => setValue(label)}
          data={data}
        />

        <Text className={"text-foreground"}>Value: {value}</Text>

        <SegmentedControl value={value} onChange={setValue}>
          {data.map((c) => (
            <Segment key={c} label={c} />
          ))}
        </SegmentedControl>
      </View>
    );
  },
};
