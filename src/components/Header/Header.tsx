import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Alert, View } from "react-native";
import type {
  HeaderContextProps,
  HeaderProps,
  HeaderProviderProps,
} from "./Header.types";
import { SafeAreaView } from "react-native-safe-area-context";
import clsx from "clsx";
import { BlurView } from "expo-blur";

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
  const [currentHeader, setCurrentHeader] = useState<React.ReactNode | null>(
    null,
  );

  const initHeader = (component: React.ReactNode) => {
    setCurrentHeader(component);
  };
  const removeHeader = () => {
    setCurrentHeader(null);
  };

  const values = useMemo<HeaderContextProps>(
    () => ({
      initHeader,
      removeHeader,
      intensity,
    }),
    [initHeader, removeHeader, intensity],
  );

  return (
    <HeaderContext value={values}>
      {currentHeader && currentHeader}
      {children}
    </HeaderContext>
  );
};

export const Header = ({
  children,
  blur,
  className,
  absolute = true,
}: HeaderProps) => {
  const { initHeader, removeHeader, intensity } = useHeaderContext();

  const Wrapper = blur ? BlurView : View;

  useEffect(() => {
    initHeader(
      <Wrapper
        intensity={intensity}
        tint={"dark"}
        className={clsx(
          "w-screen z-10",
          className,
          absolute && "!absolute !top-0",
        )}
      >
        <SafeAreaView className={"w-full items-center justify-center"}>
          {children}
        </SafeAreaView>
      </Wrapper>,
    );

    return () => {
      removeHeader();
    };
  }, []);

  return null;
};
