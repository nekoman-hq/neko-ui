import React, { useState } from 'react';
import { Meta } from '@storybook/react-native';
import { WheelPickerV2 } from './WheelPickerV2';

const meta: Meta = {
  title: 'Components/WheelPickerV2',
  component: WheelPickerV2,
};

export default meta;

export const Default = {
  render: () => {
    const [value, setValue] = useState('');

    return (
      <WheelPickerV2 />
    );
  },
};
