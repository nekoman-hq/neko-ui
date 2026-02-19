import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Header, HeaderProvider } from "@/src";
import { BlurView } from "expo-blur";

function HeaderDemo() {
  return (
    <HeaderProvider>
      <ScrollView
        className={"bg-background"}
        contentContainerClassName={"w-screen h-screen items-center p-4"}
      >
        <Text className={"text-3xl color-foreground"}>
          Header Component Demo 2
        </Text>

        <Header blur={true}>
          <View className={"w-full flex"}>
            <Text className={"text-xl text-foreground"}>
              Der Header ist von einer neuen Page!!
            </Text>
          </View>
        </Header>
      </ScrollView>
    </HeaderProvider>
  );
}

export default HeaderDemo;
