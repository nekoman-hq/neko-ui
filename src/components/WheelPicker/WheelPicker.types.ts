import QWheelPicker, {
  PickerItem,
  ValueChangedEvent,
  withVirtualized,
} from "@quidone/react-native-wheel-picker";
import { WheelPickerProps as QWheelPickerProps } from "@quidone/react-native-wheel-picker";
import { useComponentInterop } from "@/src/hooks/Classname.hooks";
import React from "react";
import { FlatListProps, ListRenderItemInfo } from "react-native";

export const VirtualizedWheelPicker = useComponentInterop(
  withVirtualized(QWheelPicker),
  {
    className: "style",
    itemTextClassName: "itemTextStyle",
  },
);
type InteropProps = React.ComponentProps<typeof VirtualizedWheelPicker>;

type RequireOnly<T, K extends keyof T> = Partial<T> & Pick<T, K>;

export interface WheelPickerProps<T>
  extends
    RequireOnly<Omit<InteropProps, "data" | "onValueChanged">, never>,
    Pick<
      FlatListProps<PickerItem<T>>,
      "onEndReached" | "onEndReachedThreshold"
    > {
  data: PickerItem<T>[];
  onValueChanged: (e: ValueChangedEvent<PickerItem<T>>) => void;
  label?: string;
  labelClassName?: string;
  className?: string;
}
