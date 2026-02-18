import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedReaction,
} from "react-native-reanimated";
import clsx from "clsx";
import { ThemeProvider } from "../ThemeProvider";
import {
  WidgetProps,
  WidgetChevronProps,
  WidgetContainerProps,
  WidgetContextType,
  WidgetHeaderProps,
  WidgetTextProps,
} from "./Widget.types";
import { ChevronDown } from "./Widget.icons";

const duration = 300;

export const withSpringConfig = {
  damping: 15,
  stiffness: 100,
  mass: 1,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

const WidgetContext = createContext<WidgetContextType | null>(null);

const useWidgetContext = () => {
  const values = useContext(WidgetContext);
  if (!values) throw new Error("Component must be within a <Widget></Widget>!");
  return values;
};

export const Widget = ({
  children,
  onExpandChange,
  initialExpand = true,
  theme,
}: WidgetProps) => {
  const [expanded, setExpanded] = useState(initialExpand);

  // Keep a ref so we can compute "next" without using a functional updater
  // (and therefore avoid side-effects during render / strict mode double-invokes)
  const expandedRef = useRef(expanded);
  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  // If the parent changes initialExpand over time, sync internal state.
  // (This matches how you're currently using it: initialExpand={props.open})
  const prevInitialExpand = useRef(initialExpand);
  useEffect(() => {
    if (prevInitialExpand.current !== initialExpand) {
      prevInitialExpand.current = initialExpand;
      expandedRef.current = initialExpand;
      setExpanded(initialExpand);
      // Intentionally NOT calling onExpandChange here to avoid loops:
      // parent changed the value, so it already "knows".
    }
  }, [initialExpand]);

  const height = useSharedValue(0);
  const targetHeight = useSharedValue(0);
  const chevronRotation = useSharedValue(initialExpand ? 0 : -90);

  // Mirror expanded state to UI-thread friendly shared value
  const expandedSV = useSharedValue(initialExpand ? 1 : 0);
  useEffect(() => {
    expandedSV.value = expanded ? 1 : 0;
  }, [expanded, expandedSV]);

  // Animate height + chevron whenever expanded changes OR targetHeight changes
  useAnimatedReaction(
    () => ({
      isExpanded: expandedSV.value,
      th: targetHeight.value,
    }),
    (curr, prev) => {
      if (!prev) return;

      // When expanded, animate to the latest measured height
      if (curr.isExpanded === 1) {
        height.value = withSpring(curr.th, withSpringConfig);
        chevronRotation.value = withTiming(0, { duration });
        return;
      }

      // When collapsed, animate to 0
      height.value = withTiming(0, { duration });
      chevronRotation.value = withTiming(-90, { duration });
    },
    [],
  );

  const toggleExpanded = useCallback(
    (callChange: boolean = true) => {
      const next = !expandedRef.current;
      expandedRef.current = next;
      setExpanded(next);

      // ✅ safe: called from event handler, not from state updater
      if (callChange) onExpandChange?.(next);
    },
    [onExpandChange],
  );

  const values = useMemo<WidgetContextType>(
    () => ({
      expanded,
      height,
      targetHeight,
      toggleExpanded,
      chevronRotation,
    }),
    [expanded, height, targetHeight, toggleExpanded, chevronRotation],
  );

  return (
    <WidgetContext.Provider value={values}>
      <ThemeProvider className={"px-2 w-full gap-2"} theme={theme}>
        {children}
      </ThemeProvider>
    </WidgetContext.Provider>
  );
};

export const WidgetHeader = ({
  children,
  className,
  disabled = false,
}: WidgetHeaderProps) => {
  const { toggleExpanded } = useWidgetContext();

  return (
    <Pressable
      disabled={disabled}
      onPress={() => toggleExpanded()}
      style={styles.headerContainer}
      className={clsx("justify-between", className)}
    >
      {children}
    </Pressable>
  );
};

export const WidgetChevron = ({ size, className }: WidgetChevronProps) => {
  const { chevronRotation } = useWidgetContext();

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  return (
    <Animated.View style={arrowAnimatedStyle}>
      <ChevronDown
        size={size}
        className={clsx("color-card-foreground", className)}
      />
    </Animated.View>
  );
};

export const WidgetContent: React.FC<WidgetContainerProps> = ({
  children,
  containerClassName,
}) => {
  const { expanded, targetHeight, height } = useWidgetContext();

  const expandAnimationStyle = useAnimatedStyle(() => ({
    height: height.value,
    width: "100%",
    borderRadius: 15,
    overflow: "hidden",
  }));

  // Helps avoid a “flash” on first open when expanded=true but we haven't measured yet.
  const hasMeasuredOnce = useRef(false);

  // Optional: one-time measure after mount (can help in some layouts),
  // but onLayout is still the main source of truth.
  const viewRef = useRef<View>(null);
  useLayoutEffect(() => {
    // no-op if measure isn't available yet
    viewRef.current?.measure?.((_x, _y, _w, h) => {
      if (h > 0 && !hasMeasuredOnce.current) {
        hasMeasuredOnce.current = true;
        if (Math.abs(targetHeight.value - h) > 0.5) {
          targetHeight.value = h;
        }
        if (expanded && height.value === 0) {
          height.value = h;
        }
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Animated.View style={expandAnimationStyle}>
        <View
          ref={viewRef}
          onLayout={(event) => {
            const h = event.nativeEvent.layout.height;
            if (h <= 0) return;

            // Only update when the measured height materially changes.
            // This avoids repeatedly re-triggering animations for identical values.
            if (Math.abs(targetHeight.value - h) > 0.5) {
              targetHeight.value = h;
            }

            // If we are currently expanded but height hasn't been set yet (first render),
            // set it immediately to avoid a delayed open.
            if (expanded && height.value === 0) {
              height.value = h;
            }
          }}
          style={styles.childrenContainer}
          className={clsx("bg-card ", containerClassName)}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
};

export const WidgetText = ({ children, className }: WidgetTextProps) => {
  return (
    <Text className={clsx("text-card-foreground text-lg", className)}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Keep absolute so closing clips instead of reflowing/collapsing awkwardly
  childrenContainer: {
    padding: 15,
    width: "100%",
    alignItems: "center",
    borderRadius: 15,
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
  },
});
