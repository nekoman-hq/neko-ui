import React from "react";
import { SharedValue } from "react-native-reanimated";
import { Theme } from "@/src/components/ThemeProvider/ThemeProvider.types";

export type WidgetContextType = {
  expanded: boolean;
  toggleExpanded: () => void;
  height: SharedValue<number>;
  targetHeight: SharedValue<number>;
  chevronRotation: SharedValue<number>;
};

export interface WidgetProps {
  children?: React.ReactNode;
  initialExpand?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  theme?: WidgetTheme;
}

export interface WidgetContainerProps {
  children?: React.ReactNode;
  containerClassName?: string;
}

export type WidgetHeaderProps = {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

export type WidgetTheme = Pick<Partial<Theme>, "card" | "cardForeground">;

export type WidgetTextProps = {
  children: string;
  className?: string;
};

export type WidgetChevronProps = {
  size?: number;
  className?: string;
};
