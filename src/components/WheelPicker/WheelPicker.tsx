import React from "react";
import { VirtualizedWheelPicker, WheelPickerProps } from "./WheelPicker.types";
import * as Haptics from "expo-haptics";
import { PickerItem } from "@quidone/react-native-wheel-picker";
import { Text, View } from "react-native";
import clsx from "clsx";
import Animated, { LinearTransition } from "react-native-reanimated";

export const WheelPicker = <T extends string | number>({
  data,
  label,
  labelClassName,
  itemTextClassName,
  className,
  ...props
}: WheelPickerProps<T>) => {
  return (
    <View className={clsx("flex-row  items-center", className)}>
      <VirtualizedWheelPicker<PickerItem<T>>
        windowSize={15}
        itemHeight={40}
        data={data}
        enableScrollByTapOnItem={true}
        itemTextClassName={clsx(
          "font-medium text-foreground text-lg px-2",
          itemTextClassName,
        )}
        renderOverlay={null}
        //@ts-ignore
        decelerationRate={0.9942}
        onValueChanging={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        {...props}
      />

      {!!label && (
        <Animated.View
          layout={LinearTransition}
          style={{ height: props.itemHeight || 40 }}
          className={"items-center"}
        >
          <Text
            className={clsx(
              "font-medium text-foreground text-lg",
              labelClassName,
            )}
          >
            {label}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};
