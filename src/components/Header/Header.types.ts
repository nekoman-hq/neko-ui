import React from "react";
import { SharedValue } from "react-native-reanimated";

export interface HeaderContextProps {
  initHeader: (component: React.ReactNode, type: HeaderDestinationType) => void;
  removeHeader: (type: HeaderDestinationType) => void;
  headerHeight: SharedValue<number>;
  intensity: number;
  currentHeaders: Record<HeaderDestinationType, React.ReactNode>;
}

export interface HeaderProps {
  children: React.ReactNode;
  blur?: boolean;
  absolute?: boolean;
  className?: string;
  destination?: HeaderDestinationType;
}

export type HeaderDestinationType = "default" | "absolute";

export interface HeaderDestinationProps {
  type?: HeaderDestinationType;
}

export interface HeaderProviderProps {
  children?: React.ReactNode;
  intensity?: number;
}

export interface HeaderSpacerProps {
  /** This value will be added or subtracted to the component. Can be used for gaps for example*/
  value?: number;
}
