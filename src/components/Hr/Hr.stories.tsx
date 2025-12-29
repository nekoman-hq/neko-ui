import React, { useState } from 'react';
import { Meta } from '@storybook/react-native';
import { Hr } from './Hr';
import {View} from "react-native";

const meta: Meta = {
  title: 'Components/Hr',
  component: Hr,
  decorators: [
    (Story) => (
        <View className={"p-4 gap-2"}>
          <Story />
        </View>
    )
  ]
};

export default meta;

export const Default = {
  render: () => {

    return (
      <Hr />
    );
  },
};
