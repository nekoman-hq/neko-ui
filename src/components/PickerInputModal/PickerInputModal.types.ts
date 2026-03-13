import React from "react";
import { InputModeOptions, KeyboardTypeOptions } from "react-native";
import BottomSheet from "@gorhom/bottom-sheet";

export type PickerInputModalValue = string | number;

export type PickerInputModalDataItem<
  T extends PickerInputModalValue = PickerInputModalValue,
> =
  | T
  | {
      value: T;
      label?: string;
    };

export interface PickerInputModalInputProps<
  T extends PickerInputModalValue = PickerInputModalValue,
> {
  value: T;
  onValueChange(value: T): void;
  data: readonly PickerInputModalDataItem<T>[];
  label?: string;
  disabled?: boolean;
  textInput?: boolean;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  inputMode?: InputModeOptions;
  maxLength?: number;
  formatValue?: (value: T) => string;
  parseTextInput?: (value: string) => T | undefined;
  onTextInputValueChange?: (value: string) => void;
  pickerItemHeight?: number;
  pickerVisibleItemCount?: number;
  pickerWidth?: number;

  pickerClassName?: string;
  pickerContainerClassName?: string;
  pickerItemTextClassName?: string;
  pickerLabelClassName?: string;

  onPickerEndReached?: () => void;
  onPickerEndReachedThreshold?: number;
}

export interface PickerInputModalInputGroupProps {
  children?: React.ReactNode;
  className?: string;
  label?: string;
  disabled?: boolean;
  textInputValue?: string;
  onTextInputValueChange?: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  inputMode?: InputModeOptions;
  maxLength?: number;
}

export interface PickerInputModalContentProps {
  children?: React.ReactNode;
  className?: string;
}

export interface PickerInputModalProps {
  children?: React.ReactNode;
}

export type PickerInputModalRef = React.ComponentRef<typeof BottomSheet>;
