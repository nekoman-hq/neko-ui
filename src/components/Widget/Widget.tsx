import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  Platform,
  UIManager,
  Text,
  Pressable,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ThemeProvider } from "../ThemeProvider";
import {
  WidgetProps,
  WidgetChevronProps,
  WidgetContainerProps,
  WidgetContextType,
  WidgetHeaderProps,
  WidgetTextProps,
} from "./Widget.types";
import clsx from "clsx";
import { ChevronDown } from "./Widget.icons";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
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
  if (!values) {
    throw new Error("Component must be within a <Widget></Widget>!");
  }
  return values;
};

export const Widget = ({
  children,
  onExpandChange,
  initialExpand = true,
  theme,
}: WidgetProps) => {
  const [expanded, setExpanded] = useState(initialExpand);

  const height = useSharedValue(initialExpand ? 0 : 0);
  const [targetHeight, setTargetHeight] = useState(0);
  const chevronRotation = useSharedValue(!initialExpand ? -90 : 0);

  const toggleExpanded = (callChange?: boolean) => {
    setExpanded((prevState) => {
      const newState = !prevState;

      onExpandChange && callChange !== false && onExpandChange(newState);
      return newState;
    });
  };

  useEffect(() => {
    if (expanded) {
      height.value = withSpring(targetHeight, withSpringConfig);
      chevronRotation.value = withTiming(0, { duration: duration });
    } else {
      height.value = withTiming(0, { duration: duration });
      chevronRotation.value = withTiming(-90, { duration: duration });
    }
  }, [expanded, targetHeight]);

  const values = useMemo<WidgetContextType>(
    () => ({
      expanded,
      height,
      targetHeight,
      setTargetHeight,
      toggleExpanded,
      chevronRotation,
    }),
    [
      expanded,
      height,
      setTargetHeight,
      targetHeight,
      toggleExpanded,
      chevronRotation,
    ],
  );

  return (
    <WidgetContext.Provider value={values}>
      <ThemeProvider className={"px-2"} theme={theme}>
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

  const handleArrowClick = () => {
    toggleExpanded();
  };

  return (
    <Pressable
      disabled={disabled}
      onPress={() => handleArrowClick()}
      style={styles.headerContainer}
      className={clsx("justify-between", className)}
    >
      {children}
    </Pressable>
  );
};

export const WidgetChevron = ({ size, className }: WidgetChevronProps) => {
  const { chevronRotation } = useWidgetContext();
  const arrowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: chevronRotation.value + "deg" }],
    };
  });
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
  const { expanded, targetHeight, setTargetHeight, height } =
    useWidgetContext();

  const addToLayoutButtonOpacity = useSharedValue(1);

  const toLayoutButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: addToLayoutButtonOpacity.value,
  }));

  const expandAnimationStyle = useAnimatedStyle(() => ({
    height: height.value,
    width: "100%",
    overflow: "hidden",
  }));

  const viewRef = useRef<View>(null);

  useEffect(() => {
    viewRef.current?.measure((x, y, width, layoutHeight, pageX, pageY) => {
      if (layoutHeight > targetHeight) {
        setTargetHeight(layoutHeight);
        if (expanded && height.value === 0) {
          // Initiale Höhe setzen wenn expanded beim ersten Render
          height.value = layoutHeight;
        }
      }
    });
  }, [viewRef, expanded, targetHeight]);

  return (
    <View
      style={{
        width: "100%",
        alignItems: "center",
      }}
    >
      <Animated.View style={expandAnimationStyle}>
        <View
          ref={viewRef}
          onLayout={(event) => {
            const layoutHeight = event.nativeEvent.layout.height;
            if (layoutHeight > targetHeight) {
              setTargetHeight(layoutHeight);
            }
          }}
          style={[styles.childrenContainer]}
          className={clsx("bg-card", containerClassName)}
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
  container: {
    overflow: "hidden",
    width: "95%",
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  headerContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  childrenContainer: {
    padding: 15,
    width: "100%",
    alignItems: "center",
    borderRadius: 15,
    position: "absolute",
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
  },
});
