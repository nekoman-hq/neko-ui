import React, { useState } from "react";
import { Meta } from "@storybook/react-native";
import { WheelPicker2 } from "./WheelPicker2";
import { useWheelPickerData } from "./WheelPicker2.hook";
import { View } from "react-native";

const meta: Meta = {
  title: "Deprecated/WheelPicker2",
  component: WheelPicker2,
};

export default meta;

export const Default = {
  render: () => {
    const [data, setData] = useState(
      Array.from({ length: 100 }).map((_, index) => index),
    );
    const [value, setValue] = useState(500);

    return (
      <View className={"w-full items-center justify-center"}>
        <WheelPicker2
          label={"kg"}
          value={value}
          data={useWheelPickerData(data)}
          onEndReachedThreshold={0.7}
          onEndReached={() => {
            console.log("Reached end");
            setData((prev) => [
              ...prev,
              ...Array.from({ length: 100 }).map(
                (_, index) => index + prev.length,
              ),
            ]);
          }}
          onValueChanged={(e) => {
            setValue(e.item.value);
          }}
        />
      </View>
    );
  },
};
