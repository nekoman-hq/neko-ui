import type { SharedValue } from "react-native-reanimated";

export type WheelPickerItem = string | number;

export interface WheelPickerProps<T extends WheelPickerItem> {
  data: T[];
  initialValue?: T;
  label?: string;
  labelClassName?: string;
  itemHeight?: number;
  pickerWidth?: number;
  hitboxHorizontalPadding?: number;
  hitboxVerticalPadding?: number;
  value?: SharedValue<T>;
}
