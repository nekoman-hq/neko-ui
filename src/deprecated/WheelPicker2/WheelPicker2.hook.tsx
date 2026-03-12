import { useMemo } from "react";
import { PickerItem } from "@quidone/react-native-wheel-picker";

export const useWheelPickerData = <T extends string | number>(
  data: T[],
): PickerItem<T>[] => {
  return useMemo(
    () =>
      data.map((item) => ({
        value: item,
        label: String(item),
      })),
    [data],
  );
};
