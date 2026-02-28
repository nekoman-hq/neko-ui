/**
 * WheelPicker Component
 *
 * A 3D wheel picker component with smooth animations and haptic feedback.
 * Supports both programmatic and user-driven scrolling with conflict resolution.
 *
 * @template T - The type of values in the picker (string or number)
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, Pressable, Text, View, type ViewStyle } from "react-native";
import {
  FlashList,
  type FlashListRef,
  type ListRenderItemInfo,
} from "@shopify/flash-list";
import Animated, {
  FadeIn,
  LinearTransition,
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  clamp,
  interpolate,
  useAnimatedReaction,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import * as Haptics from "expo-haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { debounce } from "lodash";
import {
  PickerItemProps,
  WheelPickerProps,
} from "@/src/deprecated/WheelPicker/WheelPicker.types";
import { scheduleOnRN } from "react-native-worklets";

/**
 * Height of each picker item in pixels
 * Used for scroll calculations and snap intervals
 */
const ItemHeight = 35;
const PickerHeight = ItemHeight * 5;
const ListEdgeSpacerHeight = ItemHeight * 2;
const ProgrammaticScrollDuration = 300;
const TapChangeDelay = ProgrammaticScrollDuration + 50;
const ListEdgeSpacer = () => <View style={{ height: ListEdgeSpacerHeight }} />;
const ReanimatedFlashList = Animated.createAnimatedComponent(FlashList);

const clampIndex = (value: number, length: number) => {
  if (length <= 0) return 0;
  return Math.min(Math.max(value, 0), length - 1);
};

const hasDataChanged = <T extends string | number>(
  previous: T[],
  next: T[],
) => {
  if (previous === next) return false;
  if (previous.length !== next.length) return true;

  for (let i = 0; i < next.length; i += 1) {
    if (previous[i] !== next[i]) return true;
  }

  return false;
};

export const WheelPicker = <T extends string | number>({
  index,
  onChange,
  data,
  label,
  onEndReached,
  labelClassName,
}: WheelPickerProps<T>) => {
  const initialIndexRef = useRef(clampIndex(index, data.length));
  const currentIndexRef = useRef(initialIndexRef.current);
  const onChangeRef = useRef(onChange);
  const normalizedDataRef = useRef(data);
  onChangeRef.current = onChange;

  const [contentWidth, setContentWidth] = useState(0);

  // ========================================
  // LIFECYCLE TRACKING
  // ========================================

  /**
   * Tracks whether component has completed initial mount
   * Prevents onChange from firing during initialization
   */
  const isMountedRef = useRef(false);

  // ========================================
  // SCROLL STATE FLAGS
  // ========================================

  /**
   * Indicates when scrolling is triggered programmatically (not by user)
   * Examples: external prop changes, item tap animations
   * Prevents user scroll handlers from interfering with programmatic scrolls
   */
  const isProgrammaticScroll = useSharedValue(false);

  //State for the flatlist
  const [isProgrammaticScrollState, setIsProgrammaticScrollState] =
    useState(false);

  /**
   * Indicates when user is actively scrolling manually
   * Used to prevent programmatic scroll updates during user interaction
   */
  const isUserScrolling = useSharedValue(false);

  // ========================================
  // CHANGE TRACKING
  // ========================================

  /**
   * Stores the last index value reported via onChange callback
   * Prevents duplicate onChange calls for the same value
   * Critical for avoiding redundant haptic feedback and parent updates
   */
  const lastReportedIndexRef = useRef<number | null>(null);

  /**
   * Stores timeout ID for delayed onChange calls after tap animations
   * Allows cancellation if user interacts before animation completes
   */
  const animationTimeoutRef = useRef<NodeJS.Timeout | number | null>(null);

  /**
   * Tracks the most recent tapped index during tap animation
   * Prevents race conditions when user rapidly taps multiple items
   * Only the most recent tap will trigger onChange after animation
   */
  const pendingTapIndexRef = useRef<number | null>(null);
  const programmaticScrollTimeoutRef = useRef<NodeJS.Timeout | number | null>(
    null,
  );

  // ========================================
  // ANIMATION REFERENCES
  // ========================================

  /**
   * Ref to FlashList for programmatic scrolling
   */
  const flatlistRef = useRef<FlashListRef<T>>(null);
  const animatedFlashListRef = flatlistRef as unknown as React.RefObject<any>;

  /**
   * Current scroll Y position in pixels
   * Updated on every scroll event, used for 3D transformation calculations
   */
  const scrollY = useSharedValue(0);

  if (hasDataChanged(normalizedDataRef.current, data)) {
    normalizedDataRef.current = data;
  }
  const normalizedData = normalizedDataRef.current;

  // ========================================
  // HELPER FUNCTIONS
  // ========================================

  /**
   * Clears any pending animation timeout
   * Called when:
   * - New tap occurs (cancel previous tap's delayed onChange)
   * - User starts manual scrolling (cancel tap's delayed onChange)
   * - External index prop changes (cancel any pending internal changes)
   */
  const clearAnimationTimeout = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  }, []);

  const clearProgrammaticScrollTimeout = useCallback(() => {
    if (programmaticScrollTimeoutRef.current) {
      clearTimeout(programmaticScrollTimeoutRef.current);
      programmaticScrollTimeoutRef.current = null;
    }
  }, []);

  /**
   * Reports a value change to parent component via onChange callback
   * Includes duplicate prevention and haptic feedback
   *
   * @param index - The new index to report
   *
   * Flow:
   * 1. Check if index differs from last reported value
   * 2. If different: update tracking ref, trigger haptics, call onChange
   * 3. If same: skip to avoid redundant calls
   */
  const reportValueChange = useCallback((nextIndex: number) => {
    if (
      nextIndex < 0 ||
      nextIndex >= normalizedDataRef.current.length ||
      lastReportedIndexRef.current === nextIndex
    ) {
      return;
    }

    lastReportedIndexRef.current = nextIndex;
    Haptics.impactAsync(ImpactFeedbackStyle.Light).then();
    onChangeRef.current(normalizedDataRef.current[nextIndex], nextIndex);
  }, []);

  /**
   * Debounced scroll handler for external index changes
   * Prevents excessive scroll operations when prop changes rapidly
   *
   * @param newIndex - Target index to scroll to
   * @param animated - Whether to animate the scroll (default: true)
   *
   * Flow:
   * 1. Cancel any pending timers
   * 2. Mark scroll as programmatic
   * 3. Scroll using FlashList imperative ref API
   * 4. If not animated: clear programmatic flag immediately
   * 5. Clear programmatic flag when done
   */
  const scrollToIndex = useCallback(
    (newIndex: number, animated: boolean = true) => {
      if (!isMountedRef.current) return;

      const targetScrollPosition = newIndex * ItemHeight;
      clearProgrammaticScrollTimeout();
      isProgrammaticScroll.value = true;

      flatlistRef.current?.scrollToOffset({
        offset: targetScrollPosition,
        animated,
        skipFirstItemOffset: true,
      });

      if (!animated) {
        isProgrammaticScroll.value = false;
        return;
      }

      programmaticScrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.value = false;
      }, ProgrammaticScrollDuration + 80);
    },
    [clearProgrammaticScrollTimeout, isProgrammaticScroll],
  );

  const debouncedScrollToIndex = useMemo(
    () =>
      debounce((newIndex: number, animated: boolean = true) => {
        clearAnimationTimeout();
        scrollToIndex(newIndex, animated);
      }, 300),
    [clearAnimationTimeout, scrollToIndex],
  );

  /**
   * Animated scroll handler that updates scrollY shared value
   * Fires on every scroll event (throttled to 16ms)
   */
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // ========================================
  // INTERACTION HANDLERS
  // ========================================

  /**
   * Handles when user taps on a picker item
   * Prevents interaction during scrolling or if item is already selected
   *
   * @param i - Index of the tapped item
   *
   * Flow:
   * 1. Early return if scrolling or item already selected
   * 2. Cancel any previous tap animations/timeouts
   * 3. Record this tap as pending
   * 4. Animate scroll to tapped item
   * 5. After animation delay, report change if this is still most recent tap
   *
   * Race condition prevention:
   * If user taps item A then quickly taps item B:
   * - Item A's timeout is cleared
   * - Item B becomes pendingTapIndex
   * - Only item B's onChange fires after its animation
   */
  const handleItemPress = useCallback(
    (i: number) => {
      if (i === currentIndexRef.current) return;
      if (isUserScrolling.get() || isProgrammaticScroll.get()) return;

      clearAnimationTimeout();
      scrollToIndex(i, true);

      // Timeout für onChange auf JS Thread
      pendingTapIndexRef.current = i;
      animationTimeoutRef.current = setTimeout(() => {
        if (pendingTapIndexRef.current === i) {
          currentIndexRef.current = i;
          reportValueChange(i);
          pendingTapIndexRef.current = null;
        }
      }, TapChangeDelay);
    },
    [
      clearAnimationTimeout,
      isProgrammaticScroll,
      isUserScrolling,
      reportValueChange,
      scrollToIndex,
    ],
  );

  /**
   * Handles when user finishes manual scroll (momentum ends)
   * Snaps to nearest item and reports the change
   *
   * @param e - Native scroll event
   *
   * Flow:
   * 1. Ignore if scroll was programmatic
   * 2. Calculate nearest item index from scroll position
   * 3. If index changed: update state, snap position, report change
   * 4. Clear user scrolling flag
   */
  const handleMomentumScrollEnd = useCallback(
    (e: any) => {
      if (isProgrammaticScroll.get()) {
        clearProgrammaticScrollTimeout();
        isProgrammaticScroll.set(false);
        isUserScrolling.set(false);
        return;
      }

      const newIndex = clampIndex(
        Math.round(e.nativeEvent.contentOffset.y / ItemHeight),
        normalizedDataRef.current.length,
      );

      if (newIndex !== currentIndexRef.current) {
        currentIndexRef.current = newIndex;
        reportValueChange(newIndex);
      }

      isUserScrolling.set(false);
    },
    [
      clearProgrammaticScrollTimeout,
      isProgrammaticScroll,
      isUserScrolling,
      reportValueChange,
    ],
  );

  // ========================================
  // EFFECTS
  // ========================================

  /**
   * Handles external index prop changes
   * Synchronizes internal state when parent component updates the index
   *
   * Flow on first mount:
   * - Mark as mounted, exit without calling onChange (initialization)
   *
   * Flow on subsequent updates:
   * - Clear any pending taps/timeouts (external change takes priority)
   * - Update lastReportedIndexRef to prevent duplicate onChange
   * - Cancel ongoing animations
   * - Update internal state and scroll to new position
   */
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }

    const nextIndex = clampIndex(index, normalizedData.length);
    if (nextIndex !== currentIndexRef.current) {
      clearAnimationTimeout();
      pendingTapIndexRef.current = null;
      currentIndexRef.current = nextIndex;
      lastReportedIndexRef.current = nextIndex;
      debouncedScrollToIndex(nextIndex, true);
    }
  }, [
    index,
    normalizedData.length,
    clearAnimationTimeout,
    debouncedScrollToIndex,
  ]);

  useEffect(() => {
    const clampedIndex = clampIndex(
      currentIndexRef.current,
      normalizedData.length,
    );
    if (clampedIndex !== currentIndexRef.current) {
      currentIndexRef.current = clampedIndex;
      lastReportedIndexRef.current = clampedIndex;
      debouncedScrollToIndex(clampedIndex, false);
    }
  }, [normalizedData.length, debouncedScrollToIndex]);

  /**
   * Cleanup effect
   * Cancels pending operations when component unmounts
   */
  useEffect(() => {
    return () => {
      debouncedScrollToIndex.cancel();
      clearAnimationTimeout();
      clearProgrammaticScrollTimeout();
      isMountedRef.current = false;
    };
  }, [
    clearAnimationTimeout,
    clearProgrammaticScrollTimeout,
    debouncedScrollToIndex,
  ]);

  useAnimatedReaction(
    () => isProgrammaticScroll.value,
    (current, previous) => {
      if (current !== previous) {
        scheduleOnRN(setIsProgrammaticScrollState, current);
      }
    },
  );

  const onScrollBeginDrag = useCallback(() => {
    isUserScrolling.value = true;
    isProgrammaticScroll.value = false;
    clearProgrammaticScrollTimeout();
    clearAnimationTimeout();
    pendingTapIndexRef.current = null;
  }, [
    clearAnimationTimeout,
    clearProgrammaticScrollTimeout,
    isProgrammaticScroll,
    isUserScrolling,
  ]);

  const renderItem = useCallback(
    ({ item, index, target }: ListRenderItemInfo<T>) => {
      if (target !== "Cell") {
        return <View style={{ height: ItemHeight }} />;
      }

      return (
        <PickerItem
          onPress={handleItemPress}
          index={index}
          value={item}
          height={ItemHeight}
          positionY={scrollY}
        />
      );
    },
    [handleItemPress, scrollY],
  );

  const keyExtractor = useCallback(
    (item: T, itemIndex: number) => `${itemIndex}-${item}`,
    [],
  );

  const flashListRenderItem = useCallback(
    (itemInfo: ListRenderItemInfo<unknown>) =>
      renderItem(itemInfo as ListRenderItemInfo<T>),
    [renderItem],
  );

  const flashListKeyExtractor = useCallback(
    (item: unknown, itemIndex: number) => keyExtractor(item as T, itemIndex),
    [keyExtractor],
  );

  const flashListWidth = useMemo<ViewStyle["width"]>(
    () =>
      Platform.OS === "web"
        ? ("fit-content" as unknown as ViewStyle["width"])
        : ("100%" as ViewStyle["width"]),
    [],
  );

  const flashListContainerStyle = useMemo(
    () => ({
      width: contentWidth || undefined,
    }),
    [contentWidth],
  );

  const flashListContentContainerStyle = useMemo(
    () => ({
      width: contentWidth,
    }),
    [contentWidth],
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <View
      className="w-full items-center flex-row justify-center"
      style={{ height: PickerHeight }}
    >
      {/* Width measurement ghost */}
      <Text
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
        onLayout={(e) => setContentWidth(Math.ceil(e.nativeEvent.layout.width))}
        className="font-medium text-foreground text-lg px-5"
      >
        {normalizedData.reduce(
          (longest, item) =>
            String(item).length > String(longest).length ? item : longest,
          normalizedData[0] ?? "",
        )}
      </Text>

      {/* Gradient mask for fade effect on top/bottom */}
      <MaskedView
        className={"w-full"}
        maskElement={
          <LinearGradient
            className="w-full"
            style={{ height: PickerHeight }}
            colors={[
              "rgba(0,0,0,0)", // Fully transparent at top
              "rgba(0,0,0,0.6)", // Fade in
              "rgba(0,0,0,1)", // Fully opaque at center
              "rgba(0,0,0,0.6)", // Fade out
              "rgba(0,0,0,0)", // Fully transparent at bottom
            ]}
            locations={[0, 0.4, 0.5, 0.6, 1]}
          />
        }
      >
        <ReanimatedFlashList
          entering={FadeIn}
          ref={animatedFlashListRef}
          data={normalizedData}
          renderItem={flashListRenderItem}
          keyExtractor={flashListKeyExtractor}
          initialScrollIndex={
            normalizedData.length > 0 ? initialIndexRef.current - 2 : undefined
          }
          /* FlashList v2 has maintainVisibleContentPosition enabled by default. */
          maintainVisibleContentPosition={{ disabled: true }}
          ListHeaderComponent={ListEdgeSpacer}
          ListFooterComponent={ListEdgeSpacer}
          /* Scroll behavior */
          showsVerticalScrollIndicator={false}
          style={flashListContainerStyle}
          contentContainerStyle={flashListContentContainerStyle}
          snapToInterval={ItemHeight}
          decelerationRate={0.9938}
          scrollEnabled={!isProgrammaticScrollState}
          /* Event handlers */
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          onScrollBeginDrag={onScrollBeginDrag}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        />
      </MaskedView>

      {/* Optional label (e.g., "kg", "cm") */}
      {label !== undefined && (
        <Animated.View layout={LinearTransition}>
          <Text className={labelClassName}>{label}</Text>
        </Animated.View>
      )}
    </View>
  );
};

// ========================================
// PICKER ITEM COMPONENT
// ========================================

/**
 * Individual picker item with 3D rotation effect
 * Memoized to prevent unnecessary re-renders
 *
 * 3D Effect Explanation:
 * - Items rotate on X-axis based on distance from center
 * - Center item: 0° (flat)
 * - Items above: negative rotation (top tilts back)
 * - Items below: positive rotation (bottom tilts back)
 * - Padding adjusts to maintain visual alignment during rotation
 */
const PickerItem = <T extends string | number>({
  index,
  value,
  height,
  positionY,
  onPress,
}: PickerItemProps<T>) => {
  const centerOffset = height * 2.5;
  const centerY = index * height + centerOffset;
  const maxDistanceFromCenter = height * 3;
  const interpolationInput = [
    centerY - height * 2,
    centerY - height * 0.67,
    centerY + height * 0.67,
    centerY + height * 2,
  ];

  /**
   * Handle tap on this item
   * Provides medium haptic feedback for tactile response
   */
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).then();
    onPress(index);
  }, [index, onPress]);

  /**
   * Animated style that creates 3D wheel effect
   * Recalculates on every scroll position change
   *
   * Calculations:
   * 1. centerY: Absolute Y position of this item's center
   * 2. distanceFromCenter: How far this item is from viewport center
   * 3. deg: Rotation angle (-50° to +50°) based on distance
   * 4. innerH: Height after rotation (cos projection)
   * 5. paddingTop/Bottom: Compensate for height loss to maintain spacing
   *
   * Performance optimization:
   * - Early bailout for items far from view (distanceFromCenter > 3*height)
   * - Returns simple style to avoid expensive calculations
   */
  const animatedStyle = useAnimatedStyle(() => {
    const raw = positionY.value + centerOffset;
    const distanceFromCenter = Math.abs(raw - centerY);

    if (distanceFromCenter > maxDistanceFromCenter) {
      return { opacity: 1 };
    }

    const deg = clamp(
      interpolate(raw, interpolationInput, [-50, -30, 30, 50]),
      -50,
      50,
    );

    const innerH = Math.cos((deg * Math.PI) / 180) * height;
    const paddingTop = deg < 0 ? height - innerH : 0;
    const paddingBottom = deg > 0 ? height - innerH : 0;

    return {
      transform: [{ rotateX: `${deg}deg` }],
      paddingTop,
      paddingBottom,
      opacity: 1,
    };
  });

  return (
    <Pressable
      onPress={handlePress}
      className="items-center px-5 justify-center self-center overflow-visible"
      style={{ height }}
    >
      <Animated.View style={animatedStyle}>
        <Text className={"font-medium text-foreground text-lg"}>{value}</Text>
      </Animated.View>
    </Pressable>
  );
};
