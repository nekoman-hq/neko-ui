import React, { useState } from "react";
import {
  Widget,
  WidgetChevron,
  WidgetContent,
  WidgetHeader,
  WidgetText,
} from "./Widget";
import { Text, View } from "react-native";
import { Meta } from "@storybook/react-native";

const meta: Meta = {
  title: "Components/Widget",
  component: Widget,
  decorators: [
    (Story) => (
      <View className={"py-10"}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

export const Default = {
  render: () => (
    <Widget>
      <WidgetHeader>
        <WidgetText className={"!text-foreground"}>Title in Header</WidgetText>
        <WidgetChevron className={"!color-foreground"} />
      </WidgetHeader>

      <WidgetContent>
        <Text className={"text-card-foreground"}>Content</Text>
      </WidgetContent>
    </Widget>
  ),
};

export const InitialClosed = {
  render: () => (
    <Widget initialExpand={false}>
      <WidgetHeader>
        <WidgetText className={"!text-foreground"}>Title in Header</WidgetText>
        <WidgetChevron className={"!color-foreground"} />
      </WidgetHeader>

      <WidgetContent>
        <Text className={"text-card-foreground"}>Content</Text>
      </WidgetContent>
    </Widget>
  ),
};
