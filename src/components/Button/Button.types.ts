import React from "react";
import { PressableProps, TextProps } from "react-native";

export interface ButtonProps extends PressableProps {
  children?: React.ReactNode;
  haptics?: boolean;
  disableTime?: number;
  onHold?: () => void;
}
