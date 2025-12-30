import React from "react";
import {
  ExpandingDot,
  ExpandingDotFlatlist,
  ExpandingDotProvider,
} from "./ExpandingDotFlatlist";
import { Meta } from "@storybook/react-native";
import { Alert, Text, View } from "react-native";

const meta: Meta = {
  title: "Components/ExpandingDotFlatlist",
  component: ExpandingDotFlatlist,
};

export default meta;

export const Default = {
  render: () => {
    return (
      <ExpandingDotProvider
        data={[1, 2, 3]}
        className={"gap-2"}
        renderItem={({ item }) => {
          return (
            <View className={"bg-card"}>
              <Text className={"color-foreground"}>{item}</Text>
            </View>
          );
        }}
      >
        <ExpandingDotFlatlist
          onPageChange={(pageIndex) => {
            console.log(`New page: ${pageIndex + 1}`);
          }}
        />

        <ExpandingDot />
      </ExpandingDotProvider>
    );
  },
};
