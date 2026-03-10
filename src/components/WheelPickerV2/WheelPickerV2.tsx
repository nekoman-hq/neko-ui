import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
} from "react";
import { Pressable, Text, View } from "react-native";
import type { WheelPickerV2Props } from "./WheelPickerV2.types";
import {
  FlashList,
  FlashListRef,
  ListRenderItemInfo,
} from "@shopify/flash-list";
import Animated, {
  createAnimatedComponent,
  SharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  scrollTo,
} from "react-native-reanimated";
import { scheduleOnUI } from "react-native-worklets";

const AnimatedFlashList = createAnimatedComponent(FlashList<number>);
const AnimatedView = Animated.View;

const DATA = Array.from({ length: 1000 }, (_, i) => i);
const ITEM_HEIGHT = 45;

const ITEM_CONTAINER_STYLE = {
  height: ITEM_HEIGHT,
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

const ITEM_TEXT_STYLE = {
  fontSize: 18,
  fontWeight: "600" as const,
  color: "#fff",
};

const HIDDEN_STYLE = {
  opacity: 0,
} as const;

interface PickerContextType {
  ref: ReturnType<typeof useAnimatedRef<FlashListRef<number>>>;
  scrollY: SharedValue<number>;
  scrollIndex: SharedValue<number>;
  visibleItemCount: number;
  paddingItemNumber: number;
  radius: number;
  projectedHeight: number;
  visibleRange: number;
  opacityRange: number;
}

const PickerContext = createContext<PickerContextType | null>(null);

const usePickerContext = () => {
  const v = useContext(PickerContext);
  if (!v) throw new Error("PickerContext missing");
  return v;
};

const useWheelItemStyle = (index: number) => {
  const { scrollIndex, radius, visibleRange, opacityRange } =
    usePickerContext();

  return useAnimatedStyle(() => {
    const relativeIndex = index - scrollIndex.value;

    if (Math.abs(relativeIndex) > visibleRange) {
      return HIDDEN_STYLE;
    }

    const distance = relativeIndex * ITEM_HEIGHT;
    const theta = distance / radius;
    const translateY = radius * Math.sin(theta) - distance;

    const absRelative = Math.abs(relativeIndex);
    const opacity =
      absRelative >= opacityRange
        ? 0.25
        : 1 - (absRelative / opacityRange) * 0.75;

    return {
      opacity,
      transform: [
        { perspective: 1000 },
        { translateY },
        { rotateX: `${(-theta * 180) / Math.PI}deg` },
      ],
    };
  }, [index, radius, visibleRange, opacityRange]);
};

type WheelItemProps = ListRenderItemInfo<number>;

const WheelLabel = memo(({ value }: { value: number }) => {
  return <Text style={ITEM_TEXT_STYLE}>{value}</Text>;
});

const WheelItem = memo(({ item, index, target }: WheelItemProps) => {
  if (target === "Measurement") {
    return null;
  }

  const animatedStyle = useWheelItemStyle(index);

  return (
    <AnimatedView style={[ITEM_CONTAINER_STYLE, animatedStyle]}>
      <WheelLabel value={item} />
    </AnimatedView>
  );
});

const List = () => {
  const { ref, scrollY, scrollIndex, projectedHeight } = usePickerContext();

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      scrollIndex.value = y / ITEM_HEIGHT;
    },
  });

  const renderItem = useCallback(
    (info: ListRenderItemInfo<number>) => (
      <WheelItem item={info.item} index={info.index} target={info.target} />
    ),
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
      drawDistance={ITEM_HEIGHT * 2}
      maxItemsInRecyclePool={8}
      maintainVisibleContentPosition={{ disabled: true }}
    />
  );
};

const PickerProvider = ({ children }: { children: React.ReactNode }) => {
  const ref = useAnimatedRef<FlashListRef<number>>();
  const scrollY = useSharedValue(0);
  const scrollIndex = useSharedValue(0);

  const visibleItemCount = 5;
  const paddingItemNumber = Math.floor(visibleItemCount / 2);
  const angle = 160;
  const angleRad = (angle * Math.PI) / 180;

  const arcLength = visibleItemCount * ITEM_HEIGHT;
  const radius = arcLength / angleRad;
  const projectedHeight = 2 * radius * Math.sin(angleRad / 2);

  const visibleRange = paddingItemNumber + 1;
  const opacityRange = paddingItemNumber;

  const value = useMemo<PickerContextType>(
    () => ({
      ref,
      scrollY,
      scrollIndex,
      visibleItemCount,
      paddingItemNumber,
      radius,
      projectedHeight,
      visibleRange,
      opacityRange,
    }),
    [
      ref,
      scrollY,
      scrollIndex,
      visibleItemCount,
      paddingItemNumber,
      radius,
      projectedHeight,
      visibleRange,
      opacityRange,
    ],
  );

  return (
    <PickerContext.Provider value={value}>
      <View
        style={{
          width: 100,
          height: projectedHeight,
          margin: 100,
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
