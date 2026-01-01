import React, { useState } from "react";
import { Meta } from "@storybook/react-native";
import { ProgressCircle } from "./ProgressCircle";
import { Text, View } from "react-native";
import { Button } from "@/src";

const meta: Meta = {
  title: "Components/ProgressCircle",
  component: ProgressCircle,
};

export default meta;

export const Default = {
  render: () => {
    const [value, setValue] = useState(40);

    return (
      <View>
        <ProgressCircle
          size={200}
          duration={500}
          progress={value}
          color1={"#ff0"}
          color2={"#ff9"}
        />

        <View className={"flex flex-row gap-4"}>
          <Button onPress={() => setValue((prev) => prev - 5)}>
            <Text className={"text-foreground"}>-5</Text>
          </Button>
          <Button onPress={() => setValue((prev) => prev + 5)}>
            <Text className={"text-foreground"}>+5</Text>
          </Button>
        </View>
      </View>
    );
  },
};

export const WithLabel = {
  render: () => {
    const [value, setValue] = useState(40);

    return (
      <View>
        <ProgressCircle
          size={200}
          duration={500}
          progress={value}
          color1={"#ff0"}
          color2={"#ff9"}
        >
          <Text className={"text-3xl text-foreground"}>{value} %</Text>
        </ProgressCircle>

        <View className={"flex flex-row gap-4"}>
          <Button onPress={() => setValue((prev) => prev - 5)}>
            <Text className={"text-foreground"}>-5</Text>
          </Button>
          <Button onPress={() => setValue((prev) => prev + 5)}>
            <Text className={"text-foreground"}>+5</Text>
          </Button>
        </View>
      </View>
    );
  },
};
