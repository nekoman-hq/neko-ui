import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Alert, Pressable, Text, View } from "react-native";
import type { WheelPickerV2Props } from "./WheelPickerV2.types";
import {
  FlashList,
  FlashListRef,
  ListRenderItemInfo,
} from "@shopify/flash-list";
import Animated, {
  createAnimatedComponent,
  interpolate,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  scrollTo,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

const AnimatedFlashList = createAnimatedComponent(FlashList<number>);
const AnimatedPressable = createAnimatedComponent(Pressable);

const DATA = Array.from({ length: 1000 }, (_, i) => i);
const ITEM_HEIGHT = 40;

interface PickerContextType {
  ref: ReturnType<typeof useAnimatedRef<FlashListRef<number>>>;
  scrollY: SharedValue<number>;
  visibleItemCount: number;
  paddingItemNumber: number;
  radius: number;
  projectedHeight: number;
}

const PickerContext = createContext<PickerContextType | null>(null);

const usePickerContext = () => {
  const v = useContext(PickerContext);
  if (!v) throw new Error("PickerContext missing");
  return v;
};

type WheelItemProps = ListRenderItemInfo<number>;

const WheelItem = ({ item, index, target }: WheelItemProps) => {
  const { scrollY, paddingItemNumber, radius, ref } = usePickerContext();

  // Make non-visible measurement renders as cheap as possible.
  if (target === "Measurement") {
    return;
  }

  const goalPositionY = index * ITEM_HEIGHT;

  const animatedStyle = useAnimatedStyle(() => {
    const distance = goalPositionY - scrollY.value;
    const visibleRange = (paddingItemNumber + 1) * ITEM_HEIGHT;

    if (Math.abs(distance) > visibleRange) {
      return {
        opacity: 0,
      };
    }

    const opacityThreshold = paddingItemNumber * ITEM_HEIGHT;

    const opacity = interpolate(
      scrollY.value,
      [
        goalPositionY - opacityThreshold,
        goalPositionY,
        goalPositionY + opacityThreshold,
      ],
      [0.25, 1, 0.25],
      "clamp",
    );

    const theta = distance / radius;
    const translateY = radius * Math.sin(theta) - distance;
    const rotate = -(theta * 180) / Math.PI;

    return {
      opacity,
      transform: [{ translateY }, { rotateX: `${rotate}deg` }],
    };
  }, [goalPositionY, paddingItemNumber, radius]);

  const onPress = useCallback(() => {
    scheduleOnUI(() => scrollTo(ref, 0, goalPositionY, true));
  }, [goalPositionY]);

  return (
    <AnimatedPressable
      onPress={onPress}
      style={[
        {
          height: ITEM_HEIGHT,
          alignItems: "center",
          justifyContent: "center",
        },
        animatedStyle,
      ]}
    >
      <Text style={{ fontSize: 18, fontWeight: "600", color: "#fff" }}>
        {item}
      </Text>
    </AnimatedPressable>
  );
};

const List = () => {
  const { ref, scrollY, paddingItemNumber, projectedHeight } =
    usePickerContext();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const renderItem = useCallback(
    (info: ListRenderItemInfo<number>) => <WheelItem {...info} />,
    [],
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingVertical: (projectedHeight - ITEM_HEIGHT) / 2,
    }),
    [projectedHeight],
  );

  return (
    <AnimatedFlashList
      ref={ref}
      data={DATA}
      renderItem={renderItem}
      keyExtractor={(item) => String(item)}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate={0.9938}
      contentContainerStyle={contentContainerStyle}
      drawDistance={ITEM_HEIGHT * 4}
      maintainVisibleContentPosition={{ disabled: true }}
    />
  );
};

const PickerProvider = ({ children }: { children: React.ReactNode }) => {
  const ref = useAnimatedRef<FlashListRef<number>>();
  const scrollY = useSharedValue(0);

  const visibleItemCount = 5;
  const paddingItemNumber = Math.floor(visibleItemCount / 2);
  const angle = 110;
  const angleRad = (angle * Math.PI) / 180;

  const arcLength = visibleItemCount * ITEM_HEIGHT;
  const radius = arcLength / angleRad;
  const projectedHeight = 2 * radius * Math.sin(angleRad / 2);

  const value = useMemo<PickerContextType>(
    () => ({
      ref,
      scrollY,
      visibleItemCount,
      paddingItemNumber,
      radius,
      projectedHeight,
    }),
    [
      ref,
      scrollY,
      visibleItemCount,
      paddingItemNumber,
      radius,
      projectedHeight,
    ],
  );

  return (
    <PickerContext.Provider value={value}>
      <View
        style={{
          width: 100,
          height: projectedHeight,
          margin: 100,
          backgroundColor: "#334134",
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </PickerContext.Provider>
  );
};

export const WheelPickerV2 = ({}: WheelPickerV2Props) => {
  return (
    <PickerProvider>
      <List />
    </PickerProvider>
  );
};
