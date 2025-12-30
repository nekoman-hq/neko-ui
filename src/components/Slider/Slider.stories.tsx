import React, { useState } from "react";
import { Meta } from "@storybook/react-native";
import { Slider } from "./Slider";
import { Text, View } from "react-native";

const meta: Meta = {
  title: "Components/Slider",
  component: Slider,
  decorators: [
    (Story) => (
      <View className={"p-4 pt-8 items-center"}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

export const Default = {
  render: () => {
    const [value, setValue] = useState(0.4);

    return (
      <View>
        <Slider
          snapPoints={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          initialValue={value}
          onValueChange={(value) => {
            console.log("Value changed:", value);
          }}
          onSnapToPoint={(index, value) => {
            console.log("Snapped to point:", index, "with value:", value);
            setValue(value);
          }}
          activeTrackColor="#FF6B6B"
          thumbColor="#FFFFFF"
          hapticTriggerThreshold={0.02}
          springConfig={{
            damping: 20,
            stiffness: 200,
            mass: 1,
          }}
        />

        <Text className={"text-foreground text-xl"}>Value: {value}</Text>
      </View>
    );
  },
};

export const WithLabel = {
  render: () => {
    const [value, setValue] = useState(0.4);

    return (
      <View>
        <Slider
          snapPoints={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          initialValue={value}
          onValueChange={(value) => {
            console.log("Value changed:", value);
            setValue(value);
          }}
          onSnapToPoint={(index, value) => {
            console.log("Snapped to point:", index, "with value:", value);
          }}
          labels={[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => v.toString())}
          thumbColor="#FFFFFF"
          hapticTriggerThreshold={0.02}
          springConfig={{
            damping: 20,
            stiffness: 200,
            mass: 1,
          }}
        />

        <Text className={"text-foreground text-xl"}>
          Value: {value.toFixed(3)}
        </Text>
      </View>
    );
  },
};
