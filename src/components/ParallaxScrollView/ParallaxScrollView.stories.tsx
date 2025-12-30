import React, { useState } from "react";
import { Meta } from "@storybook/react-native";
import { ParallaxItem, ParallaxScrollView } from "./ParallaxScrollView";
import { Text, View } from "react-native";
import { Hamburger } from "lucide-react-native/icons";
import { useIconWithClassname } from "@/src/hooks/Lucide.hook";

const meta: Meta = {
  title: "Components/ParallaxScrollView",
  component: ParallaxScrollView,
};

export default meta;

export const Default = {
  render: () => {
    const [value, setValue] = useState("");

    useIconWithClassname(Hamburger);

    return (
      <ParallaxScrollView contentContainerClassName={"items-center gap-10"}>
        <ParallaxItem className={"w-1/3 aspect-square bg-card rounded-xl"}>
          <Hamburger size={64} className={"color-card-foreground"} />
        </ParallaxItem>

        <View className={"gap-5"}>
          {Array.from({ length: 50 }).map((_, i) => (
            <Text key={i} className={"text-foreground text-xl"}>
              List Item {i + 1}
            </Text>
          ))}
        </View>
      </ParallaxScrollView>
    );
  },
};
