import type { SharedValue } from "react-native-reanimated";

export type WheelPickerItem = string | number;

export interface WheelPickerProps<T extends WheelPickerItem> {
  data: T[];
  initialValue?: T;
  label?: string;
  formatItemLabel?: (value: T) => string;
  className?: string;
  labelClassName?: string;
  itemTextClassName?: string;
  itemHeight?: number;
  visibleItemCount?: number;
  pickerWidth?: number;
  hitboxHorizontalPadding?: number;
  hitboxVerticalPadding?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  value?: SharedValue<T>;
}
