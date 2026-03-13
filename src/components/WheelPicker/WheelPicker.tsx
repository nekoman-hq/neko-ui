import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { Text, View } from "react-native";
import type { WheelPickerItem, WheelPickerProps } from "./WheelPicker.types";
import clsx from "clsx";
import {
  FlashList,
  type FlashListRef,
  type ListRenderItemInfo,
} from "@shopify/flash-list";
import Animated, {
  AnimatedRef,
  createAnimatedComponent,
  SharedValue,
  useAnimatedRef,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  scrollTo,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import * as Haptics from "expo-haptics";

const AnimatedFlashList = createAnimatedComponent(FlashList<WheelPickerItem>);
const AnimatedView = Animated.View;
const DEFAULT_ITEM_HEIGHT = 45;
const DEFAULT_PICKER_WIDTH = 50;
const PICKER_MARGIN_VERTICAL = 80;
const DEFAULT_HITBOX_HORIZONTAL_PADDING = 24;
const DEFAULT_HITBOX_VERTICAL_PADDING = 20;

const TAP_MAX_DURATION_MS = 220;
const TAP_MAX_MOVE_PX = 8;

const ITEM_CONTAINER_STYLE = {
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
  data: WheelPickerItem[];
  ref: AnimatedRef<FlashListRef<WheelPickerItem>>;
  scrollY: SharedValue<number>;
  scrollIndex: SharedValue<number>;
  selectedIndex: SharedValue<number>;
  value?: SharedValue<WheelPickerItem>;
  initialIndex: number;
  visibleItemCount: number;
  paddingItemNumber: number;
  radius: number;
  projectedHeight: number;
  visibleRange: number;
  opacityRange: number;
  itemHeight: number;
  pickerWidth: number;
  hitboxHorizontalPadding: number;
  hitboxVerticalPadding: number;
}

const PickerContext = createContext<PickerContextType | null>(null);

const usePickerContext = () => {
  const v = useContext(PickerContext);
  if (!v) throw new Error("PickerContext missing");
  return v;
};

const clamp = (value: number, min: number, max: number) => {
  "worklet";
  return Math.min(Math.max(value, min), max);
};

const getClampedIndex = (value: number, length: number) => {
  "worklet";
  if (length <= 0) {
    return 0;
  }

  return clamp(Math.round(value), 0, length - 1);
};

const getClampedIndexForOffset = (
  offsetY: number,
  length: number,
  itemHeight: number,
) => {
  "worklet";
  return getClampedIndex(offsetY / itemHeight, length);
};

const getIndexForValue = (value: WheelPickerItem, data: WheelPickerItem[]) => {
  "worklet";
  for (let i = 0; i < data.length; i += 1) {
    if (data[i] === value) {
      return i;
    }
  }

  return 0;
};

const getItemValueForIndex = (data: WheelPickerItem[], index: number) => {
  "worklet";
  if (data.length === 0) {
    return undefined;
  }

  return data[getClampedIndex(index, data.length)] ?? data[0];
};

const triggerSelectionHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch();
};

const syncValueForIndex = (
  data: WheelPickerItem[],
  value: SharedValue<WheelPickerItem> | undefined,
  index: number,
) => {
  "worklet";
  if (!value || data.length === 0) {
    return;
  }

  const nextValue = getItemValueForIndex(data, index);

  if (nextValue === undefined) {
    return;
  }

  if (value.value !== nextValue) {
    value.value = nextValue;
    scheduleOnRN(triggerSelectionHaptic);
  }
};

const commitOffset = (
  offsetY: number,
  data: WheelPickerItem[],
  itemHeight: number,
  scrollY: SharedValue<number>,
  scrollIndex: SharedValue<number>,
  selectedIndex: SharedValue<number>,
  value: SharedValue<WheelPickerItem> | undefined,
) => {
  "worklet";
  const nextIndex = getClampedIndexForOffset(offsetY, data.length, itemHeight);
  const snappedOffsetY = nextIndex * itemHeight;

  scrollY.value = snappedOffsetY;
  scrollIndex.value = nextIndex;
  selectedIndex.value = nextIndex;
  syncValueForIndex(data, value, nextIndex);
};

const scrollToIndex = (
  ref: AnimatedRef<FlashListRef<WheelPickerItem>>,
  data: WheelPickerItem[],
  itemHeight: number,
  index: number,
  scrollY: SharedValue<number>,
  scrollIndex: SharedValue<number>,
  selectedIndex: SharedValue<number>,
  value: SharedValue<WheelPickerItem> | undefined,
  animated: boolean,
) => {
  "worklet";
  if (data.length === 0) {
    return;
  }

  const nextIndex = getClampedIndex(index, data.length);
  const nextOffsetY = nextIndex * itemHeight;

  if (!animated) {
    selectedIndex.value = nextIndex;
    syncValueForIndex(data, value, nextIndex);
    scrollY.value = nextOffsetY;
    scrollIndex.value = nextIndex;
  }

  scrollTo(ref, 0, nextOffsetY, animated);
};

const useWheelItemStyle = (index: number) => {
  const { scrollIndex, radius, visibleRange, opacityRange, itemHeight } =
    usePickerContext();

  return useAnimatedStyle(() => {
    const relativeIndex = index - scrollIndex.value;

    if (Math.abs(relativeIndex) > visibleRange) {
      return HIDDEN_STYLE;
    }

    const distance = relativeIndex * itemHeight;
    const theta = clamp(distance / radius, -Math.PI / 2, Math.PI / 2);

    const translateY = Number((radius * Math.sin(theta) - distance).toFixed(2));

    return {
      opacity: 1,
      transform: [
        { perspective: 1000 },
        { translateY },
        { rotateX: `${(-theta * 180) / Math.PI}deg` },
      ],
    };
  }, [index, itemHeight, radius, visibleRange, opacityRange]);
};

type WheelItemProps = ListRenderItemInfo<WheelPickerItem>;

const WheelLabel = memo(({ value }: { value: WheelPickerItem }) => {
  return <Text style={ITEM_TEXT_STYLE}>{value}</Text>;
});

const WheelItem = memo(({ item, index }: WheelItemProps) => {
  const { itemHeight } = usePickerContext();
  const animatedStyle = useWheelItemStyle(index);

  return (
    <AnimatedView
      style={[ITEM_CONTAINER_STYLE, { height: itemHeight }, animatedStyle]}
    >
      <WheelLabel value={item} />
    </AnimatedView>
  );
});

const List = () => {
  const {
    data,
    ref,
    scrollY,
    scrollIndex,
    selectedIndex,
    value: controlledValue,
    projectedHeight,
    initialIndex,
    itemHeight,
    pickerWidth,
    hitboxHorizontalPadding,
    hitboxVerticalPadding,
  } = usePickerContext();
  const didCorrectInitialOffsetRef = useRef(false);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      scrollY.value = y;
      scrollIndex.value = y / itemHeight;
    },
    onMomentumEnd: (event) => {
      commitOffset(
        event.contentOffset.y,
        data,
        itemHeight,
        scrollY,
        scrollIndex,
        selectedIndex,
        controlledValue,
      );
    },
  });

  useAnimatedReaction(
    () => scrollY.value,
    (offsetY, previousOffsetY) => {
      const nextIndex = getClampedIndexForOffset(
        offsetY,
        data.length,
        itemHeight,
      );
      const snappedOffsetY = nextIndex * itemHeight;
      const delta =
        previousOffsetY === null || previousOffsetY === undefined
          ? 0
          : Math.abs(offsetY - previousOffsetY);
      const isSettled = Math.abs(offsetY - snappedOffsetY) < 0.5 && delta < 0.5;
      const isAlreadySynced =
        selectedIndex.value === nextIndex &&
        controlledValue?.value === getItemValueForIndex(data, nextIndex);

      if (!isSettled || isAlreadySynced) {
        return;
      }

      commitOffset(
        offsetY,
        data,
        itemHeight,
        scrollY,
        scrollIndex,
        selectedIndex,
        controlledValue,
      );
    },
    [controlledValue, data, itemHeight, scrollIndex, scrollY, selectedIndex],
  );

  const renderItem = useCallback(
    (info: ListRenderItemInfo<WheelPickerItem>) => <WheelItem {...info} />,
    [],
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingVertical:
        (projectedHeight - itemHeight) / 2 + hitboxVerticalPadding,
    }),
    [hitboxVerticalPadding, itemHeight, projectedHeight],
  );

  const handleCommitLayoutEffect = useCallback(() => {
    if (didCorrectInitialOffsetRef.current) {
      return;
    }

    didCorrectInitialOffsetRef.current = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollY.value = initialIndex * itemHeight;
        scrollIndex.value = initialIndex;
        selectedIndex.value = initialIndex;
        ref.current?.scrollToOffset({
          offset: initialIndex * itemHeight,
          animated: false,
          skipFirstItemOffset: true,
        });
      });
    });
  }, [initialIndex, itemHeight, ref, scrollIndex, scrollY, selectedIndex]);

  return (
    <AnimatedFlashList
      ref={ref}
      style={{
        width: pickerWidth + hitboxHorizontalPadding * 2,
        height: projectedHeight + hitboxVerticalPadding * 2,
      }}
      data={data}
      renderItem={renderItem}
      keyExtractor={(item, index) => `${String(item)}-${index}`}
      maintainVisibleContentPosition={{ disabled: true }}
      onCommitLayoutEffect={handleCommitLayoutEffect}
      onScroll={onScroll}
      scrollEventThrottle={16}
      showsVerticalScrollIndicator={false}
      snapToInterval={itemHeight}
      decelerationRate={0.9938}
      contentContainerStyle={contentContainerStyle}
      drawDistance={itemHeight * 4}
      maxItemsInRecyclePool={8}
    />
  );
};

const getDeltaIndexFromOffset = (
  offsetFromCenter: number,
  projectedHeight: number,
  itemHeight: number,
) => {
  const abs = Math.abs(offsetFromCenter);
  const direction = offsetFromCenter < 0 ? -1 : 1;

  const centerDeadZone = itemHeight * 0.32;

  const bZoneOuterBoundary = itemHeight * 1.55;

  const virtualOuterBoundary = projectedHeight / 2 + itemHeight * 0.75;

  if (abs <= centerDeadZone) {
    return 0;
  }

  if (abs <= bZoneOuterBoundary) {
    return 1 * direction;
  }

  if (abs <= virtualOuterBoundary) {
    return 2 * direction;
  }

  return 2 * direction;
};
const PickerViewport = ({
  children,
  hitboxHorizontalPadding,
  hitboxVerticalPadding,
}: {
  children: React.ReactNode;
  hitboxHorizontalPadding: number;
  hitboxVerticalPadding: number;
}) => {
  const {
    data,
    ref,
    scrollIndex,
    scrollY,
    selectedIndex,
    value: controlledValue,
    projectedHeight,
    itemHeight,
    pickerWidth,
  } = usePickerContext();

  const touchContainerRef = useRef<View | null>(null);
  const touchContainerTopRef = useRef(0);

  const touchStartYRef = useRef(0);
  const touchStartXRef = useRef(0);
  const touchStartTimeRef = useRef(0);
  const movedTooFarRef = useRef(false);
  const isMultiTouchRef = useRef(false);

  const extendedHeight = projectedHeight + hitboxVerticalPadding * 2;
  const extendedWidth = pickerWidth + hitboxHorizontalPadding * 2;

  const measureContainer = useCallback(() => {
    touchContainerRef.current?.measureInWindow((_x, y) => {
      touchContainerTopRef.current = y;
    });
  }, []);

  const resetTouchState = useCallback(() => {
    movedTooFarRef.current = false;
    isMultiTouchRef.current = false;
    touchStartTimeRef.current = 0;
    touchStartXRef.current = 0;
    touchStartYRef.current = 0;
  }, []);

  const handleLayout = useCallback(() => {
    requestAnimationFrame(measureContainer);
  }, [measureContainer]);

  const handleTouchStart = useCallback(
    (event: any) => {
      measureContainer();

      const { nativeEvent } = event;

      isMultiTouchRef.current = (nativeEvent.touches?.length ?? 1) > 1;
      movedTooFarRef.current = false;
      touchStartTimeRef.current = Date.now();
      touchStartXRef.current = nativeEvent.pageX;
      touchStartYRef.current = nativeEvent.pageY;
    },
    [measureContainer],
  );

  const handleTouchMove = useCallback((event: any) => {
    if (isMultiTouchRef.current) {
      return;
    }

    const { nativeEvent } = event;

    if ((nativeEvent.touches?.length ?? 1) > 1) {
      isMultiTouchRef.current = true;
      return;
    }

    const dx = nativeEvent.pageX - touchStartXRef.current;
    const dy = nativeEvent.pageY - touchStartYRef.current;

    if (Math.abs(dx) > TAP_MAX_MOVE_PX || Math.abs(dy) > TAP_MAX_MOVE_PX) {
      movedTooFarRef.current = true;
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    resetTouchState();
  }, [resetTouchState]);

  const handleTouchEnd = useCallback(
    (event: any) => {
      const duration = Date.now() - touchStartTimeRef.current;

      if (
        isMultiTouchRef.current ||
        movedTooFarRef.current ||
        duration > TAP_MAX_DURATION_MS
      ) {
        resetTouchState();
        return;
      }

      const pageY = event.nativeEvent.pageY;

      // Y relativ zur vergrößerten Touch-Fläche
      const localExtendedY = pageY - touchContainerTopRef.current;

      // In das Koordinatensystem der sichtbaren Picker-Fläche zurückschieben
      const localY = localExtendedY - hitboxVerticalPadding;

      const centerY = projectedHeight / 2;
      const offsetFromCenter = localY - centerY;

      const deltaIndex = getDeltaIndexFromOffset(
        offsetFromCenter,
        projectedHeight,
        itemHeight,
      );

      if (deltaIndex === 0) {
        resetTouchState();
        return;
      }

      const currentIndex = Math.round(scrollIndex.value);
      const targetIndex = Math.max(
        0,
        Math.min(data.length - 1, currentIndex + deltaIndex),
      );

      scheduleOnUI(() => {
        "worklet";
        scrollToIndex(
          ref,
          data,
          itemHeight,
          targetIndex,
          scrollY,
          scrollIndex,
          selectedIndex,
          controlledValue,
          true,
        );
      });

      resetTouchState();
    },
    [
      controlledValue,
      data,
      hitboxVerticalPadding,
      itemHeight,
      projectedHeight,
      ref,
      resetTouchState,
      scrollIndex,
      scrollY,
      selectedIndex,
    ],
  );

  return (
    <View
      style={{
        width: pickerWidth,
        height: projectedHeight,
        marginVertical: PICKER_MARGIN_VERTICAL,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: -hitboxVerticalPadding,
          left: -hitboxHorizontalPadding,
          width: extendedWidth,
          height: extendedHeight,
        }}
        ref={touchContainerRef}
        onLayout={handleLayout}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        <MaskedView
          style={{
            width: extendedWidth,
            height: extendedHeight,
          }}
          maskElement={
            <View style={{ flex: 1 }}>
              <LinearGradient
                style={{
                  position: "absolute",
                  top: hitboxVerticalPadding,
                  left: hitboxHorizontalPadding,
                  width: pickerWidth,
                  height: projectedHeight,
                }}
                colors={[
                  "rgba(0,0,0,0)",
                  "rgba(0,0,0,0.2)",
                  "rgba(0,0,0,0.7)",
                  "rgba(0,0,0,1)",
                  "rgba(0,0,0,0.7)",
                  "rgba(0,0,0,0.2)",
                  "rgba(0,0,0,0)",
                ]}
                locations={[0, 0.08, 0.26, 0.5, 0.74, 0.92, 1]}
              />
            </View>
          }
        >
          {children}
        </MaskedView>
      </View>
    </View>
  );
};
const PickerProvider = ({
  children,
  data,
  initialValue,
  itemHeight,
  pickerWidth,
  hitboxHorizontalPadding,
  hitboxVerticalPadding,
  value: controlledValue,
}: {
  children: React.ReactNode;
  data: WheelPickerItem[];
  initialValue?: WheelPickerItem;
  itemHeight: number;
  pickerWidth: number;
  hitboxHorizontalPadding: number;
  hitboxVerticalPadding: number;
  value?: SharedValue<WheelPickerItem>;
}) => {
  const initialIndex = useRef(
    initialValue === undefined ? 0 : getIndexForValue(initialValue, data),
  ).current;

  const ref = useAnimatedRef<FlashListRef<WheelPickerItem>>();

  const visibleItemCount = 5;
  const paddingItemNumber = Math.floor(visibleItemCount / 2);
  const angle = 160;
  const angleRad = (angle * Math.PI) / 180;

  const arcLength = visibleItemCount * itemHeight;
  const radius = arcLength / angleRad;
  const projectedHeight = 2 * radius * Math.sin(angleRad / 2);

  const visibleRange = paddingItemNumber + 2;
  const opacityRange = paddingItemNumber + 1;

  const scrollY = useSharedValue(
    initialIndex * itemHeight - (projectedHeight - itemHeight) / 2,
  );
  const scrollIndex = useSharedValue(initialIndex);
  const selectedIndex = useSharedValue(initialIndex);

  useAnimatedReaction(
    () => controlledValue?.value,
    (nextValue) => {
      if (nextValue === undefined || data.length === 0) {
        return;
      }

      const nextIndex = getIndexForValue(nextValue, data);
      const normalizedValue = getItemValueForIndex(data, nextIndex);
      const shouldScroll = nextIndex !== selectedIndex.value;
      const shouldNormalize = nextValue !== normalizedValue;

      if (!shouldScroll && !shouldNormalize) {
        return;
      }

      scrollToIndex(
        ref,
        data,
        itemHeight,
        nextIndex,
        scrollY,
        scrollIndex,
        selectedIndex,
        controlledValue,
        true,
      );
    },
    [
      controlledValue,
      data,
      itemHeight,
      ref,
      scrollIndex,
      scrollY,
      selectedIndex,
    ],
  );

  const contextValue = useMemo<PickerContextType>(
    () => ({
      data,
      ref,
      scrollY,
      scrollIndex,
      selectedIndex,
      value: controlledValue,
      initialIndex,
      visibleItemCount,
      paddingItemNumber,
      radius,
      projectedHeight,
      visibleRange,
      opacityRange,
      itemHeight,
      pickerWidth,
      hitboxHorizontalPadding,
      hitboxVerticalPadding,
    }),
    [
      data,
      ref,
      scrollY,
      scrollIndex,
      selectedIndex,
      controlledValue,
      initialIndex,
      visibleItemCount,
      paddingItemNumber,
      radius,
      projectedHeight,
      visibleRange,
      opacityRange,
      itemHeight,
      pickerWidth,
      hitboxHorizontalPadding,
      hitboxVerticalPadding,
    ],
  );

  return (
    <PickerContext.Provider value={contextValue}>
      <PickerViewport
        hitboxHorizontalPadding={hitboxHorizontalPadding}
        hitboxVerticalPadding={hitboxVerticalPadding}
      >
        {children}
      </PickerViewport>
    </PickerContext.Provider>
  );
};

export const WheelPicker = <T extends WheelPickerItem>({
  data,
  initialValue,
  label,
  labelClassName,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  pickerWidth = DEFAULT_PICKER_WIDTH,
  hitboxHorizontalPadding = DEFAULT_HITBOX_HORIZONTAL_PADDING,
  hitboxVerticalPadding = DEFAULT_HITBOX_VERTICAL_PADDING,
  value,
}: WheelPickerProps<T>) => {
  const resolvedItemHeight = Math.max(1, itemHeight);
  const resolvedPickerWidth = Math.max(1, pickerWidth);
  const resolvedHitboxHorizontalPadding = Math.max(0, hitboxHorizontalPadding);
  const resolvedHitboxVerticalPadding = Math.max(0, hitboxVerticalPadding);

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <PickerProvider
        data={data}
        initialValue={initialValue}
        itemHeight={resolvedItemHeight}
        pickerWidth={resolvedPickerWidth}
        hitboxHorizontalPadding={resolvedHitboxHorizontalPadding}
        hitboxVerticalPadding={resolvedHitboxVerticalPadding}
        value={value as SharedValue<WheelPickerItem> | undefined}
      >
        <List />
      </PickerProvider>

      {label ? (
        <Text className={clsx("ml-3", labelClassName)} style={ITEM_TEXT_STYLE}>
          {label}
        </Text>
      ) : null}
    </View>
  );
};
