import React, { useState } from 'react';
import { Meta } from '@storybook/react-native';
import { Swipeable } from './Swipeable';
import {Alert, Text, View} from "react-native";
import {ChevronLeft, Trash} from "lucide-react-native";

const meta: Meta = {
  title: 'Components/Swipeable',
  component: Swipeable,

  decorators: [
    (Story) => (
        <View className={"p-4 flex flex-1"}>
          <Story />
        </View>
    )
  ]
};

export default meta;

export const Default = {
  render: () => {

    return (
          <Swipeable
          onSubmit={() => {
            Alert.alert("DELETE")
          }}
          icon={
            <Trash color={'#f00'} size={24} />
          }
          >
            <View className={"w-full h-10 bg-card items-center justify-center flex-row gap-2"}>
              <ChevronLeft color={'#fff'} />
                <Text className={"text-card-foreground text-lg"}>
                  Swipe to left
                </Text>
              <ChevronLeft color={'#fff'} />
            </View>
          </Swipeable>
    );
  },
};
