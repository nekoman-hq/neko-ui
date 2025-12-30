import React from "react";
import { InputModeOptions, KeyboardTypeOptions } from "react-native";
import { TextInput as ReactNativeTextInput } from "react-native/Libraries/Components/TextInput/TextInput";
import { SharedValue } from "react-native-reanimated";

export interface TextInputProps {
  keyboardType?: KeyboardTypeOptions;
  value: string;
  onChange(value: string): void;
  inputRef?: React.RefObject<ReactNativeTextInput | null>;
  rightText?: string;
  placeholder?: string;
  fontSize?: number;
  multiline?: boolean;
  labelTopSize?: number;
  inputMode?: InputModeOptions;
  secureTextEntry?: boolean;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters" | undefined;
  children?: React.ReactNode;
}

export interface TextInputContextType {
  animatedFontSize: SharedValue<number>;
  animatedFontOpacity: SharedValue<number>;
  /*
   (labelTopSize - 2) / fontSize
   */
  labelTopSize: number;
  fontSize: number;
  isDefaultEmpty: boolean;
  inputFocused: boolean;
}
