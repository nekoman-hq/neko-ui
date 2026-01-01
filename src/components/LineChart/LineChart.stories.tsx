import React, { useState } from "react";
import { Meta } from "@storybook/react-native";
import { LineChart } from "./LineChart";
import { Text, View } from "react-native";

const meta: Meta = {
  title: "Components/LineChart",
  component: LineChart,
  decorators: [
    (Story) => {
      return (
        <View className={"p-4"}>
          <Text className={"text-foreground text-xl font-semibold"}>
            Line Chart
          </Text>
          <Story />
        </View>
      );
    },
  ],
};

export default meta;

export const Default = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <LineChart
        items={[{ value: 10 }, { value: 14 }, { value: 13 }, { value: 77 }]}
        color1={"#00c6ff"}
        color2={"#1924ff"}
      />
    );
  },
};

export const WithLabel = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <LineChart
        items={[
          { value: 10, label: "start" },
          { value: 14 },
          { value: 55, label: "middle" },
          { value: 13 },
          { value: 77, label: "end" },
        ]}
        color1={"#00c6ff"}
        color2={"#1924ff"}
        labelClassName={"text-lg color-muted-foreground"}
      />
    );
  },
};
