import React, { useState } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { Theme } from "@/src/components/ThemeProvider/ThemeProvider.types";
import { Button } from "@/src";
import { Text, View } from "react-native";
import { ButtonText } from "@/src/components/Button/Button";

const meta = {
  title: "Components/ThemeProvider",
  component: ThemeProvider,
  decorators: [
    (Story: React.FC) => (
      <View className={"p-4"}>
        <Story />
      </View>
    ),
  ],
};

export default meta;

export const Default = {
  render: () => {
    const [theme, setTheme] = useState<Partial<Theme>>({});

    return (
      <ThemeProvider className={"gap-10 items-start"} theme={theme}>
        <Button
          onPress={() => {
            setTheme({
              primary: "#ffff00",
              primaryForeground: "#000",
              card: "#382b2b",
            });
          }}
        >
          <ButtonText>Change Theme</ButtonText>
        </Button>

        <View className={"flex flex-row gap-2 flex-wrap"}>
          <View className={"p-4 w-fit bg-primary rounded-2xl"}>
            <Text
              className={"text-primary-foreground font-bold text-base w-fit"}
            >
              Primary Color
            </Text>
          </View>

          <View className={"p-4 w-fit bg-card rounded-2xl"}>
            <Text className={"text-card-foreground font-bold text-base w-fit"}>
              Secondary Color
            </Text>
          </View>
        </View>
      </ThemeProvider>
    );
  },
};
