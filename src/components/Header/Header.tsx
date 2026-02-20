import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, View } from "react-native";
import type {
  HeaderContextProps,
  HeaderDestinationProps,
  HeaderDestinationType,
  HeaderProps,
  HeaderProviderProps,
  HeaderSpacerProps,
} from "./Header.types";
import { SafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const HeaderContext = createContext<HeaderContextProps | null>(null);

const useHeaderContext = () => {
  const values = useContext(HeaderContext);
  if (!values) {
    throw new Error("Component must be within a <HeaderProvider />!");
  }
  return values;
};

export const HeaderProvider = ({
  children,
  intensity = 25,
}: HeaderProviderProps) => {
  const headerHeight = useSharedValue<number>(0);
  const [currentHeaders, setCurrentHeaders] = useState<
    Record<HeaderDestinationType, React.ReactNode>
  >({
    default: null,
    absolute: null,
  });

  const initHeader = (
    component: React.ReactNode,
    destination: HeaderDestinationType,
  ) => {
    setCurrentHeaders((prev) => ({ ...prev, [destination]: component }));
  };
  const removeHeader = (destination: HeaderDestinationType) => {
    setCurrentHeaders((prev) => ({ ...prev, [destination]: null }));
  };

  const values = useMemo<HeaderContextProps>(
    () => ({
      initHeader,
      removeHeader,
      headerHeight,
      intensity,
      currentHeaders,
    }),
    [initHeader, removeHeader, intensity, currentHeaders],
  );

  return <HeaderContext value={values}>{children}</HeaderContext>;
};

export const Header = ({
  children,
  blur,
  className,
  absolute = true,
  destination = "default",
}: HeaderProps) => {
  const { initHeader, removeHeader, intensity, headerHeight } =
    useHeaderContext();

  const Wrapper = blur ? BlurView : View;

  useEffect(() => {
    initHeader(
      <Wrapper
        onLayout={(e) => {
          if (e.nativeEvent.layout.height !== headerHeight.value) {
            headerHeight.value = e.nativeEvent.layout.height;
          }
        }}
        intensity={intensity}
        tint={"dark"}
        className={clsx(
          "w-screen z-0 pb-6",
          className,
          absolute && "!absolute !top-0 !z-10",
        )}
      >
        <SafeAreaView
          edges={["top"]}
          className={"w-full items-center justify-center"}
        >
          {children}
        </SafeAreaView>
      </Wrapper>,
      destination,
    );

    return () => {
      removeHeader(destination);
    };
  }, [children]);

  return null;
};

export const HeaderDestination = ({
  type = "default",
}: HeaderDestinationProps) => {
  const { currentHeaders } = useHeaderContext();

  return currentHeaders[type];
};

export const HeaderSpacer = ({ value }: HeaderSpacerProps) => {
  const { headerHeight } = useHeaderContext();

  const ref = useAnimatedRef<View>();
  const positionY = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    height: headerHeight.value - positionY.value + (value || 0),
    width: 100,
  }));

  return (
    <Animated.View
      ref={ref}
      style={style}
      onLayout={() => {
        ref.current?.measure((x, y, width, height, px, py) => {
          positionY.value = py;
        });
      }}
    />
  );
};
