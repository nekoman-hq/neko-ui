import React, {useState} from 'react';
import {Checkbox, CheckboxProvider} from './Checkbox';
import {Pressable, Text, View} from "react-native";
import {Meta} from "@storybook/react-native";

const meta :Meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  decorators: [
    (Story) => (
        <View className={"p-4"}>
          <Story />
        </View>
    )
  ]
};

export default meta;

export const Default = {
  render: () => {
    const [checked, setChecked] = useState(false)

    return (
        <View className={"flex flex-row gap-2 items-center"}>
          <Text className={"text-foreground text-xl"}>
            Checkbox:
          </Text>

          <Checkbox
              checked={checked}
              onPress={() => setChecked(prev => !prev)} />
        </View>
    )
  }
};

export const WithLabel = {
  render: () => {
    const [checked, setChecked] = useState(false)

    return (
        <Pressable onPress={() => setChecked(prev => !prev)} className={"flex flex-row gap-2 items-center "}>

          <Checkbox
              checked={checked}
          />

          <Text className={"text-foreground text-xl"}>
            Todo 1
          </Text>
        </Pressable>
    )
  }
};

export const WithProvider = {
  render: () => {
    const [checked, setChecked] = useState(false)

    return (
        <CheckboxProvider theme={{checkboxActive: '#f0f'}}>
          <Pressable onPress={() => setChecked(prev => !prev)} className={"flex flex-row gap-2 items-center "}>

            <Checkbox
                checked={checked}
            />

            <Text className={"text-foreground text-xl"}>
              Other Active Color
            </Text>
          </Pressable>
        </CheckboxProvider>
    )
  }
}
