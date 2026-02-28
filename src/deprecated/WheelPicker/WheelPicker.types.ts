import React from "react";
import { SharedValue } from "react-native-reanimated";
import { FlatList } from "react-native";

export interface WheelPickerProps<T extends string | number> {
  index: number;
  data: T[];
  onChange: (value: T, index: number) => void;
  label?: string;
  onEndReached?: () => void;
  labelClassName?: string;
}

export interface PickerItemProps<T extends string | number> {
  index: number;
  value: T;
  height: number;
  positionY: SharedValue<number>;
  onPress(i: number): void;
}
