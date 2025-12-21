/**
 * WheelPicker Component
 *
 * A 3D wheel picker component with smooth animations and haptic feedback.
 * Supports both programmatic and user-driven scrolling with conflict resolution.
 *
 * @template T - The type of values in the picker (string or number)
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
  ReduceMotion,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useSharedValue,
  withTiming,
  cancelAnimation,
  useAnimatedStyle,
  clamp,
  interpolate, useAnimatedReaction,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import * as Haptics from "expo-haptics";
import { ImpactFeedbackStyle } from "expo-haptics";
import { debounce } from "lodash";
import { WheelPickerProps } from "@/src";
import { PickerItemProps } from "@/src/components/WheelPicker/WheelPicker.types";
import {scheduleOnRN, scheduleOnUI} from "react-native-worklets";

/**
 * Animation configuration for smooth transitions
 * - duration: 300ms for balanced speed and smoothness
 * - easing: Quadratic ease-in-out for natural motion
 * - reduceMotion: Respects system accessibility settings
 */
const withTimingConfig = {
  duration: 300,
  easing: Easing.inOut(Easing.quad),
  reduceMotion: ReduceMotion.System,
};

/**
 * Height of each picker item in pixels
 * Used for scroll calculations and snap intervals
 */
const ItemHeight = 35;

export const WheelPicker = <T extends string | number>({
  index,
  onChange,
  data,
  label,
  onEndReached,
}: WheelPickerProps<T>) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================

  /**
   * Single source of truth for the currently selected index
   * Synchronized with external `index` prop and internal scroll position
   */
  const [currentIndex, setCurrentIndex] = useState(index);

  // ========================================
  // LIFECYCLE TRACKING
  // ========================================

  /**
   * Tracks whether component has completed initial mount
   * Prevents onChange from firing during initialization
   */
  const isMountedRef = useRef(false);

  /**
   * Indicates if component is in initialization phase
   * Used to avoid triggering callbacks on first render
   */
  const isInitializingRef = useRef(true);

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
  const [isProgrammaticScrollState, setIsProgrammaticScrollState] = useState(false);

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
  const animationTimeoutRef = useRef<number | null>(null);

  /**
   * Tracks the most recent tapped index during tap animation
   * Prevents race conditions when user rapidly taps multiple items
   * Only the most recent tap will trigger onChange after animation
   */
  const pendingTapIndexRef = useRef<number | null>(null);

  // ========================================
  // ANIMATION REFERENCES
  // ========================================

  /**
   * Reanimated reference to the FlatList for programmatic scrolling
   */
  const flatlistRef = useAnimatedRef<FlatList<number>>();

  /**
   * Current scroll Y position in pixels
   * Updated on every scroll event, used for 3D transformation calculations
   */
  const scrollY = useSharedValue(0);

  /**
   * Target scroll position for programmatic scrolling
   * Updated via withTiming for smooth animated scrolls
   */
  const targetScrollPosition = useSharedValue(index * ItemHeight);

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
  const clearAnimationTimeout = () => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = null;
    }
  };

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
  const reportValueChange = (index: number) => {
    if (lastReportedIndexRef.current !== index) {
      lastReportedIndexRef.current = index;
      Haptics.impactAsync(ImpactFeedbackStyle.Light).then();
      onChange(data[index], index);
    }
  };

  /**
   * Debounced scroll handler for external index changes
   * Prevents excessive scroll operations when prop changes rapidly
   *
   * @param newIndex - Target index to scroll to
   * @param animated - Whether to animate the scroll (default: true)
   *
   * Flow:
   * 1. Cancel any ongoing animations
   * 2. Mark scroll as programmatic
   * 3. If animated: use withTiming for smooth transition
   * 4. If not animated: jump immediately to position
   * 5. Clear programmatic flag when done
   */
  const debouncedScrollToIndex = useRef(
    debounce((newIndex: number, animated: boolean = true) => {
      if (!isMountedRef.current) return;

      cancelAnimation(targetScrollPosition);
      clearAnimationTimeout();
      isProgrammaticScroll.value = true;

      if (animated) {
        targetScrollPosition.value = withTiming(
          newIndex * ItemHeight,
          withTimingConfig,
          () => {
            isProgrammaticScroll.value = false;
          },
        );
      } else {
        targetScrollPosition.value = newIndex * ItemHeight;
        isProgrammaticScroll.value = false;
      }
    }, 300),
  ).current;

  /**
   * Apply programmatic scroll position changes to FlatList
   * Only applies when user is not actively scrolling
   * Runs on every frame via useDerivedValue
   */
  useDerivedValue(() => {
    if (!isUserScrolling.value) {
      scrollTo(flatlistRef, 0, targetScrollPosition.value, false);
    }
  });

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
        if (i === currentIndex) return;

        clearAnimationTimeout();

        // Check und Animation innerhalb von scheduleOnUI
        scheduleOnUI(() => {
          'worklet';

          // Jetzt können wir sicher auf .value zugreifen
          if (isUserScrolling.value || isProgrammaticScroll.value) return;

          cancelAnimation(targetScrollPosition);
          isProgrammaticScroll.value = true;

          targetScrollPosition.value = withTiming(
              i * ItemHeight,
              withTimingConfig,
              () => {
                isProgrammaticScroll.value = false;
              },
          );
        });

        // Timeout für onChange auf JS Thread
        pendingTapIndexRef.current = i;
        animationTimeoutRef.current = setTimeout(() => {
          if (pendingTapIndexRef.current === i) {
            reportValueChange(i);
            pendingTapIndexRef.current = null;
          }
        }, withTimingConfig.duration + 50);
      },
      [data, onChange, currentIndex],
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
      'worklet'
      if (isProgrammaticScroll.get()) return;

      const newIndex = Math.round(e.nativeEvent.contentOffset.y / ItemHeight);

      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        targetScrollPosition.value = newIndex * ItemHeight;
        reportValueChange(newIndex);
      }

      isUserScrolling.set(false);
    },
    [currentIndex, data, onChange],
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
      isInitializingRef.current = false;
      return;
    }

    if (index !== undefined && index !== currentIndex) {
      clearAnimationTimeout();
      pendingTapIndexRef.current = null;
      lastReportedIndexRef.current = index;

      cancelAnimation(targetScrollPosition);
      setCurrentIndex(index);
      debouncedScrollToIndex(index, true);
    }
  }, [index]);

  /**
   * Cleanup effect
   * Cancels pending operations when component unmounts
   */
  useEffect(() => {
    return () => {
      debouncedScrollToIndex.cancel();
      clearAnimationTimeout();
      isMountedRef.current = false;
    };
  }, []);

  useAnimatedReaction(
      () => isProgrammaticScroll.value,
      (current, previous) => {
        if (current !== previous) {
          scheduleOnRN(setIsProgrammaticScrollState, current);
        }
      },
  );

  // ========================================
  // RENDER
  // ========================================

  return (
    <View>
      <View
        className="w-full items-center flex-row justify-center"
        style={{ height: ItemHeight * 5 }}
      >
        {/* Gradient mask for fade effect on top/bottom */}
        <MaskedView
          maskElement={
            <LinearGradient
              className="w-full"
              style={{ height: ItemHeight * 5 }}
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
          <Animated.FlatList
            entering={FadeIn}
            ref={flatlistRef}
            data={data}
            renderItem={({ index }) => (
              <PickerItem
                onPress={handleItemPress}
                index={index}
                value={data[index]}
                height={ItemHeight}
                positionY={scrollY}
              />
            )}
            keyExtractor={(item, index) => `${index}-${item}`}
            /* Performance optimizations */
            initialNumToRender={10}
            maxToRenderPerBatch={15}
            windowSize={15}
            initialScrollIndex={index}
            removeClippedSubviews
            updateCellsBatchingPeriod={50}
            /* Layout configuration */
            getItemLayout={(_, i) => ({
              length: ItemHeight,
              offset: ItemHeight * i,
              index: i,
            })}
            ListHeaderComponent={<View style={{ height: ItemHeight * 2 }} />}
            ListFooterComponent={<View style={{ height: ItemHeight * 2 }} />}
            /* Scroll behavior */
            showsVerticalScrollIndicator={false}
            className="overflow-hidden self-center"
            style={{ height: ItemHeight * 5 }}
            snapToInterval={ItemHeight}
            decelerationRate={0.9938}
            scrollEnabled={!isProgrammaticScrollState}
            /* Event handlers */
            onScrollToIndexFailed={(info) => {
              const wait = new Promise((resolve) => setTimeout(resolve, 500));
              wait.then(() => {
                flatlistRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                });
              });
            }}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            onScrollBeginDrag={() => {
              isUserScrolling.value = true;
              isProgrammaticScroll.value = false;
              clearAnimationTimeout();
              pendingTapIndexRef.current = null;
            }}
            onMomentumScrollEnd={handleMomentumScrollEnd}
          />
        </MaskedView>

        {/* Optional label (e.g., "kg", "cm") */}
        {label !== undefined && (
          <Animated.View layout={LinearTransition}>
            <Text>{label}</Text>
          </Animated.View>
        )}
      </View>
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
const PickerItem = React.memo(
  <T extends string | number>({
    index,
    value,
    height,
    positionY,
    onPress,
  }: PickerItemProps<T>) => {
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
      const centerY = index * height + height * 2.5;
      const distanceFromCenter = Math.abs(
        positionY.value + height * 2.5 - centerY,
      );

      if (distanceFromCenter > height * 3) {
        return { opacity: 1 };
      }

      const raw = positionY.value + height * 2.5;

      const deg = clamp(
        interpolate(
          raw,
          [
            centerY - height * 2,
            centerY - height * 0.67,
            centerY + height * 0.67,
            centerY + height * 2,
          ],
          [-50, -30, 30, 50],
        ),
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
          <Text className={"font-medium text-foreground text-lg"}>
            {value}
          </Text>
        </Animated.View>
      </Pressable>
    );
  },
);
