import React, { useState } from "react";
import { Meta } from "@storybook/react-native";
import { Header, HeaderProvider } from "./Header";
import { ScrollView, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Button, ButtonText } from "@/src/components/Button";
import { router } from "expo-router";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const meta: Meta = {
  title: "Components/Header",
  decorators: [
    (Story) => {
      return (
        <HeaderProvider>
          <Story />
        </HeaderProvider>
      );
    },
  ],
  component: Header,
};

export default meta;

export const Default = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <ScrollView
        className={"bg-card"}
        contentContainerClassName={"w-screen h-screen items-center p-4"}
      >
        <Text className={"text-3xl color-foreground"}>
          Header Component Demo
        </Text>

        <Header blur={true}>
          <View className={"w-full py-10"}>
            <Text className={"text-xl text-foreground"}>
              Das ist der Header!!!
            </Text>

            <Button
              onPress={() => {
                router.push("HeaderDemo");
              }}
            >
              <ButtonText>New Page</ButtonText>
            </Button>
          </View>
        </Header>
      </ScrollView>
    );
  },
};

export const ExpandingContent = {
  render: () => {
    const show = useSharedValue(false);

    const animatedStyle = useAnimatedStyle(() => ({
      height: withTiming(show.value ? 100 : 0),
      width: 100,
      backgroundColor: "#f0f",
    }));

    return (
      <ScrollView
        className={"bg-card"}
        contentContainerClassName={"w-screen h-screen items-center p-4"}
      >
        <Text className={"text-3xl color-foreground"}>
          Header Component Demo
        </Text>

        <Header blur={true} className={"!bg-background/50"}>
          <View className={"w-full py-4 flex-row justify-between"}>
            <Text className={"text-xl text-foreground"}>
              Das ist der Header!!!
            </Text>

            <Button
              onPress={() => {
                show.value = !show.value;
              }}
            >
              <ButtonText>Toggle View</ButtonText>
            </Button>
          </View>

          <Animated.View style={animatedStyle}></Animated.View>
        </Header>
      </ScrollView>
    );
  },
};
