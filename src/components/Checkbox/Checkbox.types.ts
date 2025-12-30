import React from "react";
import { ButtonProps } from "../Button";
import { Theme } from "@/src/components/ThemeProvider/ThemeProvider.types";

export interface CheckboxProps extends ButtonProps {
  checked: boolean;
  onPress?(): void;
  className?: string;
}

export interface CheckboxProviderProps {
  children?: React.ReactNode;
  theme?: Partial<
    Pick<Theme, "checkboxActive" | "checkboxInactive" | "checkboxIcon">
  >;
}
