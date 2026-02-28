import React, { useState } from "react";
import { Meta } from "@storybook/react-native";
import { Example } from "./Example";
import WheelPicker, {
  OnValueChanged,
  withVirtualized,
} from "@quidone/react-native-wheel-picker";
import { useStableCallback } from "@rozhkov/react-useful-hooks";
import * as Haptics from "expo-haptics";
import { View } from "react-native";

const meta: Meta = {
  title: "Components/Example",
  component: Example,
};
const VirtualizedWheelPicker = withVirtualized(WheelPicker);

export default meta;

export const Default = {
  render: () => {
    const data = [...Array(1000).keys()].map((index) => ({
      value: index,
      label: index.toString(),
    }));

    const [value, setValue] = useState(500);
    const [selectedLanguage, setSelectedLanguage] = useState();

    const onChange = useStableCallback(async (item: number) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });

    return (
      <VirtualizedWheelPicker
        //value={value}
        windowSize={15}
        data={data}
        onValueChanged={({ item }) => onChange(item.value)}
        enableScrollByTapOnItem={true}
        itemTextStyle={{ color: "#fff" }}
        //@ts-ignore
        decelerationRate={0.9944}
        onValueChanging={async () => {
          //await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      />
    );
  },
};
